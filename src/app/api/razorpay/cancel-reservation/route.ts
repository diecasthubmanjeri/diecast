import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ReservationModel } from '@/models/Reservation';
import { removeFallbackReservation } from '@/lib/fallbackStorage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpayOrderId } = body;

    if (!razorpayOrderId) {
      return NextResponse.json({ success: false, error: 'Missing razorpayOrderId' }, { status: 400 });
    }

    const db = await connectDB();
    if (db) {
      await ReservationModel.deleteMany({ razorpayOrderId: String(razorpayOrderId) });
    } else {
      removeFallbackReservation(String(razorpayOrderId));
    }

    return NextResponse.json({ success: true, message: 'Stock hold released successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to release reservation';
    console.error('[API Cancel Reservation Error]:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
