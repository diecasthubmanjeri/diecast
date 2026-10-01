import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import { OrderModel } from '@/models/Order';
import { ReservationModel } from '@/models/Reservation';
import { ProductModel } from '@/models/Product';

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ success: false, error: 'No signature found' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ success: false, error: 'Webhook secret not configured' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyText)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(bodyText);

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const paymentEntity = event.payload.payment?.entity;
      const orderEntity = event.payload.order?.entity;

      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const razorpayPaymentId = paymentEntity?.id;

      if (razorpayOrderId) {
        const db = await connectDB();
        if (db) {
          const order = await OrderModel.findOne({ razorpayOrderId });
          if (order && order.paymentStatus === 'Pending') {
            order.paymentStatus = 'Paid';
            if (razorpayPaymentId) {
              order.razorpayPaymentId = razorpayPaymentId;
            }
            await order.save();
            
            // Deduct stock for each item
            for (const item of order.items) {
              const product = await ProductModel.findOne({ id: item.id });
              if (product && !product.isPreorder) {
                await ProductModel.updateOne(
                  { _id: product._id, stock: { $gte: item.quantity } },
                  { $inc: { stock: -item.quantity } }
                );
              }
            }

            // Release temporary stock reservation
            try {
              await ReservationModel.deleteMany({ razorpayOrderId: String(razorpayOrderId) });
            } catch (delErr) {
              console.warn('[Reservation Delete Warning]:', delErr);
            }
            console.log(`[Webhook] Order ${order.id} marked as Paid via webhook and stock updated.`);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Razorpay Webhook Error]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
