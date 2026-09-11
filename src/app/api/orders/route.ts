import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { OrderModel, IOrderItem } from '@/models/Order';
import { ProductModel } from '@/models/Product';
import { CartModel } from '@/models/Cart';
import { OfferModel } from '@/models/Offer';
import { getOrCreateSessionId, attachSessionCookie } from '@/lib/session';
import {
  getFallbackOrders,
  saveFallbackOrder,
  getFallbackProducts,
  getFallbackOffers,
} from '@/lib/fallbackStorage';
import { verifyRazorpaySignature } from '@/lib/razorpay';

export async function GET(req: NextRequest) {
  try {
    const { sessionId, isNew } = getOrCreateSessionId(req);

    // Strict privacy & IDOR protection: Public visitors can ONLY fetch orders belonging
    // to their verified session. Arbitrary phone/email querying is restricted to the admin portal.
    const db = await connectDB();
    if (!db) {
      const orders = getFallbackOrders({ sessionId });
      const res = NextResponse.json({ success: true, data: orders, source: 'fallback' });
      if (isNew) attachSessionCookie(res, sessionId);
      return res;
    }

    const orders = await OrderModel.find({ sessionId }).sort({ createdAt: -1 }).lean();

    const res = NextResponse.json({ success: true, data: orders });
    if (isNew) attachSessionCookie(res, sessionId);
    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching orders';
    console.error('[API Orders GET Error]:', message);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      address,
      city,
      state,
      pinCode,
      shippingPartner,
      items,
      clearCartAfterOrder,
      paymentMethod = 'Razorpay',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = body;

    // 1. Strict Server-Side Validation of customer details
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Please enter a valid full name.' }, { status: 400 });
    }

    const phoneRegex = /^[0-9+\s-]{10,15}$/;
    if (!customerPhone || !phoneRegex.test(customerPhone.trim())) {
      return NextResponse.json({ success: false, error: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail || !emailRegex.test(customerEmail.trim())) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!address || typeof address !== 'string' || address.trim().length < 5) {
      return NextResponse.json({ success: false, error: 'Please enter a complete delivery address.' }, { status: 400 });
    }

    if (!city || typeof city !== 'string' || city.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Please enter your city.' }, { status: 400 });
    }

    if (!state || typeof state !== 'string' || state.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Please select your state.' }, { status: 400 });
    }

    const pinRegex = /^[0-9]{6}$/;
    if (!pinCode || !pinRegex.test(pinCode.trim())) {
      return NextResponse.json({ success: false, error: 'Please enter a valid 6-digit PIN code.' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Order must contain at least one item.' }, { status: 400 });
    }

    // 2. Cryptographic Payment Verification (Prevents Payment Bypass / Manipulation)
    let paymentStatus: 'Paid' | 'Pending' | 'Failed' = 'Paid';
    if (paymentMethod === 'Razorpay') {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return NextResponse.json(
          { success: false, error: 'Payment verification failed: missing Razorpay transaction signature.' },
          { status: 400 }
        );
      }

      const isValid = verifyRazorpaySignature({
        orderId: String(razorpayOrderId),
        paymentId: String(razorpayPaymentId),
        signature: String(razorpaySignature),
      });

      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Payment signature verification failed. Tampered or fraudulent transaction.' },
          { status: 400 }
        );
      }
      paymentStatus = 'Paid';
    } else {
      // For any offline / non-Razorpay method if ever allowed, default to Pending
      paymentStatus = 'Pending';
    }

    const { sessionId, isNew } = getOrCreateSessionId(req);
    const db = await connectDB();

    if (!db) {
      const validatedItems: IOrderItem[] = [];
      let calculatedSubtotal = 0;
      const fallbackProds = getFallbackProducts();

      for (const item of items) {
        const quantity = Math.max(1, Math.min(100, Number(item.quantity) || 1));
        const product = fallbackProds.find((p) => p.id === item.id || p.slug === item.id);
        if (!product) {
          return NextResponse.json(
            { success: false, error: `Invalid product in order: "${item.name || item.id}". Product does not exist.` },
            { status: 400 }
          );
        }

        const effectivePrice =
          product.isPreorder && product.preorderAmount && product.preorderAmount > 0
            ? product.preorderAmount
            : product.price;

        calculatedSubtotal += effectivePrice * quantity;
        validatedItems.push({
          id: product.id,
          name: product.name,
          price: effectivePrice,
          quantity,
          image: product.image,
          scale: product.scale || item.scale || '',
          color: item.color || '',
        });
      }

      // Backend protected offer discount calculation
      const fallbackOffers = getFallbackOffers(true);
      const qualifyingOffers = fallbackOffers.filter((o) => calculatedSubtotal >= o.minPurchaseAmount);
      qualifyingOffers.sort((a, b) => {
        const discA = (calculatedSubtotal * a.discountPercentage) / 100;
        const discB = (calculatedSubtotal * b.discountPercentage) / 100;
        return discB - discA;
      });

      const bestOffer = qualifyingOffers[0] || null;
      const discountAmount = bestOffer
        ? Math.round((calculatedSubtotal * bestOffer.discountPercentage) / 100)
        : 0;
      const calculatedTotal = Math.max(0, calculatedSubtotal - discountAmount);
      const offerApplied = bestOffer ? bestOffer.title : '';

      const orderId = 'ORD' + Date.now().toString();
      const newOrder = saveFallbackOrder({
        id: orderId,
        date: new Date().toISOString(),
        status: 'Pending',
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerPhone: customerPhone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pinCode: pinCode.trim(),
        shippingPartner: shippingPartner || 'Indian Post (Door-to-Door Delivery)',
        items: validatedItems,
        subtotal: calculatedSubtotal,
        discountAmount,
        offerApplied,
        totalAmount: calculatedTotal,
        sessionId,
        paymentMethod,
        paymentStatus,
        razorpayOrderId: razorpayOrderId || '',
        razorpayPaymentId: razorpayPaymentId || '',
        razorpaySignature: razorpaySignature || '',
      });

      const res = NextResponse.json({ success: true, data: newOrder, source: 'fallback' }, { status: 201 });
      if (isNew) attachSessionCookie(res, sessionId);
      return res;
    }

    // 3. MongoDB: Server-Authoritative Price Calculation & Atomic Stock Verification
    const validatedItems: IOrderItem[] = [];
    let calculatedSubtotal = 0;

    for (const item of items) {
      const quantity = Math.max(1, Math.min(100, Number(item.quantity) || 1));
      let product = await ProductModel.findOne({ $or: [{ id: item.id }, { slug: item.id }] });

      if (!product) {
        // Check fallback products for seed/catalog parity
        const fallbackProds = getFallbackProducts();
        const fbProd = fallbackProds.find((p) => p.id === item.id || p.slug === item.id);
        if (!fbProd) {
          return NextResponse.json(
            { success: false, error: `Invalid product in order: "${item.name || item.id}". Product does not exist.` },
            { status: 400 }
          );
        }

        const effectivePrice =
          fbProd.isPreorder && fbProd.preorderAmount && fbProd.preorderAmount > 0
            ? fbProd.preorderAmount
            : fbProd.price;

        calculatedSubtotal += effectivePrice * quantity;
        validatedItems.push({
          id: fbProd.id,
          name: fbProd.name,
          price: effectivePrice,
          quantity,
          image: fbProd.image,
          scale: fbProd.scale || item.scale || '',
          color: item.color || '',
        });
        continue;
      }

      // If regular stock product (not preorder), check stock
      if (!product.isPreorder && product.stock < quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for "${product.name}". Available: ${product.stock}` },
          { status: 400 }
        );
      }

      // Deduct stock atomically
      if (!product.isPreorder) {
        await ProductModel.updateOne(
          { _id: product._id, stock: { $gte: quantity } },
          { $inc: { stock: -quantity } }
        );
      }

      const effectivePrice = (product.isPreorder && product.preorderAmount && product.preorderAmount > 0)
        ? product.preorderAmount
        : product.price;

      calculatedSubtotal += effectivePrice * quantity;

      validatedItems.push({
        id: product.id,
        name: product.name,
        price: effectivePrice,
        quantity,
        image: product.image,
        scale: product.scale || item.scale || '',
        color: item.color || '',
      });
    }

    // Backend protected offer discount calculation
    const activeOffers = await OfferModel.find({ isActive: true }).lean();
    const qualifyingOffers = activeOffers.filter((o) => calculatedSubtotal >= o.minPurchaseAmount);
    qualifyingOffers.sort((a, b) => {
      const discA = (calculatedSubtotal * a.discountPercentage) / 100;
      const discB = (calculatedSubtotal * b.discountPercentage) / 100;
      return discB - discA;
    });

    const bestOffer = qualifyingOffers[0] || null;
    const discountAmount = bestOffer
      ? Math.round((calculatedSubtotal * bestOffer.discountPercentage) / 100)
      : 0;
    const calculatedTotal = Math.max(0, calculatedSubtotal - discountAmount);
    const offerApplied = bestOffer ? bestOffer.title : '';

    // 3. Create and Save Order
    const orderId = 'ORD' + Date.now().toString();
    const newOrder = await OrderModel.create({
      id: orderId,
      date: new Date(),
      status: 'Pending',
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pinCode: pinCode.trim(),
      shippingPartner: shippingPartner || 'Indian Post (Door-to-Door Delivery)',
      items: validatedItems,
      subtotal: calculatedSubtotal,
      discountAmount,
      offerApplied,
      totalAmount: calculatedTotal,
      sessionId,
      paymentMethod: paymentMethod || 'Razorpay',
      paymentStatus: paymentStatus || 'Paid',
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || '',
      razorpaySignature: razorpaySignature || '',
    });

    // 4. Clear cart if checked out from cart
    if (clearCartAfterOrder) {
      await CartModel.findOneAndUpdate({ sessionId }, { $set: { items: [] } });
    }

    const res = NextResponse.json({ success: true, data: newOrder }, { status: 201 });
    if (isNew) attachSessionCookie(res, sessionId);
    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error creating order';
    console.error('[API Orders POST Error]:', message);
    return NextResponse.json({ success: false, error: 'Failed to place order. Please try again.' }, { status: 500 });
  }
}
