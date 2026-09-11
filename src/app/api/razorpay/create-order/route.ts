import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayInstance } from '@/lib/razorpay';
import { connectDB } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { OfferModel } from '@/models/Offer';
import { getFallbackProducts, getFallbackOffers } from '@/lib/fallbackStorage';

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
        for (const item of items) {
          const qty = Math.max(1, Number(item.quantity) || 1);
          const prod = await ProductModel.findOne({ $or: [{ id: item.id }, { slug: item.id }] });
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

    const keyId =
      process.env.RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      'rzp_test_TZAp3OiWkGlLZH';

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
