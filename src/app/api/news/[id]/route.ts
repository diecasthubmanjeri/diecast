import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { NewsModel } from '@/models/News';
import { checkAdminAuth } from '@/lib/adminAuth';
import { clearCache } from '@/lib/cache';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { id } = await params;
    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    const body = await req.json();
    if (!body.text || typeof body.text !== 'string' || !body.text.trim()) {
      return NextResponse.json({ success: false, error: 'News text is required' }, { status: 400 });
    }

    const updated = await NewsModel.findOneAndUpdate(
      { id },
      { $set: { text: body.text.trim() } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: 'News item not found' }, { status: 404 });
    }

    clearCache('news_');
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating news';
    console.error('[API News PUT Error]:', message);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { id } = await params;
    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    const deleted = await NewsModel.findOneAndDelete({ id });
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'News item not found' }, { status: 404 });
    }

    clearCache('news_');
    return NextResponse.json({ success: true, message: 'News item deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting news';
    console.error('[API News DELETE Error]:', message);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
