import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayInstance } from '@/lib/razorpay';
import { connectDB } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { OfferModel } from '@/models/Offer';
import { ReservationModel } from '@/models/Reservation';
import {
  getFallbackProducts,
  getFallbackOffers,
  getActiveFallbackReservations,
  saveFallbackReservation,
} from '@/lib/fallbackStorage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, currency = 'INR', receipt, notes } = body;

    let payableTotal = 0;

    // Server-side authoritative price and offer calculation
    if (Array.isArray(items) && items.length > 0) {
      const db = await connectDB();
      let calculatedSubtotal = 0;

      if (!db) {
        const fallbackProds = getFallbackProducts();
        for (const item of items) {
          const qty = Math.max(1, Number(item.quantity) || 1);
          const prod = fallbackProds.find((p) => p.id === item.id || p.slug === item.id);
          if (prod && !prod.isPreorder) {
            const activeHold = getActiveFallbackReservations(prod.id);
            const effectiveStock = prod.stock - activeHold;
            if (effectiveStock < qty) {
              return NextResponse.json(
                {
                  success: false,
                  error:
                    effectiveStock <= 0
                      ? `"${prod.name}" is currently reserved by another customer completing checkout. Please try again in a few minutes.`
                      : `Cannot proceed: "${prod.name}" only has ${effectiveStock} unit(s) left (${activeHold} held in active checkouts).`,
                },
                { status: 409 }
              );
            }
          }
          const price = prod
            ? (prod.isPreorder && prod.preorderAmount && prod.preorderAmount > 0 ? prod.preorderAmount : prod.price)
            : Math.max(0, Number(item.price) || 0);
          calculatedSubtotal += price * qty;
        }

        const fallbackOffers = getFallbackOffers(true);
        const qualifyingOffers = fallbackOffers.filter((o) => calculatedSubtotal >= o.minPurchaseAmount);
        qualifyingOffers.sort((a, b) => b.discountPercentage - a.discountPercentage);
        const bestOffer = qualifyingOffers[0] || null;
        const discountAmount = bestOffer
          ? Math.round((calculatedSubtotal * bestOffer.discountPercentage) / 100)
          : 0;
        payableTotal = Math.max(1, calculatedSubtotal - discountAmount);
      } else {
        const now = new Date();
        for (const item of items) {
          const qty = Math.max(1, Number(item.quantity) || 1);
          const prod = await ProductModel.findOne({ $or: [{ id: item.id }, { slug: item.id }] });
          if (prod && !prod.isPreorder) {
            // Find active unexpired reservations for this product
            const activeReservations = await ReservationModel.find({
              'items.productId': prod.id,
              expiresAt: { $gt: now },
            }).lean();
            const totalReserved = activeReservations.reduce((sum, r) => {
              const found = r.items.find((i) => i.productId === prod.id);
              return sum + (found ? found.quantity : 0);
            }, 0);

            const effectiveStock = prod.stock - totalReserved;
            if (effectiveStock < qty) {
              return NextResponse.json(
                {
                  success: false,
                  error:
                    effectiveStock <= 0
                      ? `"${prod.name}" is currently reserved by another customer completing checkout. Please try again in a few minutes.`
                      : `Cannot proceed: "${prod.name}" only has ${effectiveStock} unit(s) left (${totalReserved} held in active checkouts).`,
                },
                { status: 409 }
              );
            }
          }
          const price = prod
            ? (prod.isPreorder && prod.preorderAmount && prod.preorderAmount > 0 ? prod.preorderAmount : prod.price)
            : Math.max(0, Number(item.price) || 0);
          calculatedSubtotal += price * qty;
        }

        const activeOffers = await OfferModel.find({ isActive: true }).lean();
        const qualifyingOffers = activeOffers.filter((o) => calculatedSubtotal >= o.minPurchaseAmount);
        qualifyingOffers.sort((a, b) => b.discountPercentage - a.discountPercentage);
        const bestOffer = qualifyingOffers[0] || null;
        const discountAmount = bestOffer
          ? Math.round((calculatedSubtotal * bestOffer.discountPercentage) / 100)
          : 0;
        payableTotal = Math.max(1, calculatedSubtotal - discountAmount);
      }
    } else {
      // Fallback to numeric amount if no items array sent
      payableTotal = Number(body.amount);
    }

    if (!payableTotal || payableTotal <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid payment amount could not be determined.' },
        { status: 400 }
      );
    }

    const razorpay = getRazorpayInstance();
    // Razorpay expects amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(payableTotal * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    });

    // 10-Minute Film Seat Booking Style Temporary Stock Hold
    if (Array.isArray(items) && items.length > 0) {
      const reservationItems = items.map((item: any) => ({
        productId: item.id,
        quantity: Math.max(1, Number(item.quantity) || 1),
      }));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minute hold

      try {
        const db = await connectDB();
        if (db) {
          await ReservationModel.create({
            razorpayOrderId: order.id,
            items: reservationItems,
            expiresAt,
          });
        } else {
          saveFallbackReservation({
            razorpayOrderId: order.id,
            items: reservationItems,
            expiresAt: expiresAt.getTime(),
          });
        }
      } catch (reserveErr) {
        console.warn('[Reservation Hold Warning]:', reserveErr);
      }
    }

    const keyId =
      process.env.RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      'rzp_live_TamrhwLSG7gdpa';

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error creating Razorpay order';
    console.error('[API Razorpay Create Order Error]:', message, error);
    return NextResponse.json(
      { success: false, error: message || 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}
