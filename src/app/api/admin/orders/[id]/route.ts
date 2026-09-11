import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { OrderModel } from '@/models/Order';
import { updateFallbackOrderStatus } from '@/lib/fallbackStorage';
import { checkAdminAuth } from '@/lib/adminAuth';

const VALID_STATUSES = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, trackingId } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const updateFields: any = { status };
    if (trackingId !== undefined) {
      updateFields.trackingId = trackingId;
    }

    const db = await connectDB();
    if (!db) {
      const updated = updateFallbackOrderStatus(id, updateFields);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updated, source: 'fallback' });
    }

    const updated = await OrderModel.findOneAndUpdate(
      { id },
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating order status';
    console.error('[API Admin Order Status PATCH Error]:', message);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
