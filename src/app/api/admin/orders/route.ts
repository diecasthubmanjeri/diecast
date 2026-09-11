import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { OrderModel } from '@/models/Order';
import { getFallbackOrders } from '@/lib/fallbackStorage';
import { checkAdminAuth } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const db = await connectDB();
    if (!db) {
      const orders = getFallbackOrders({ status: status || undefined });
      return NextResponse.json({ success: true, count: orders.length, data: orders, source: 'fallback' });
    }

    const filter: Record<string, any> = {};
    if (status) {
      filter.status = status;
    }

    const orders = await OrderModel.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, count: orders.length, data: orders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching admin orders';
    console.error('[API Admin Orders GET Error]:', message);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
