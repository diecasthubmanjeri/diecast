import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { NewsModel } from '@/models/News';
import { seedInitialDataIfNeeded } from '@/lib/seed';
import { getCached, setCached, clearCache } from '@/lib/cache';
import { checkAdminAuth } from '@/lib/adminAuth';

const DEFAULT_NEWS = [
  { id: '1', text: '🚨 Big Sale: Up to 50% off on all 1/18 scale models!' },
  { id: '2', text: '🚗 New arrivals from Hot Wheels and Matchbox just landed!' },
  { id: '3', text: '✨ Free shipping on orders over ₹2000!' },
  { id: '4', text: '🔥 Pre-order the exclusive 2024 limited editions now!' },
];

export async function GET() {
  try {
    const cacheKey = 'news_active';
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
      });
    }

    const db = await connectDB();
    if (!db) {
      const resp = { success: true, data: DEFAULT_NEWS };
      setCached(cacheKey, resp, 60);
      return NextResponse.json(resp, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
      });
    }

    await seedInitialDataIfNeeded();
    const news = await NewsModel.find({ active: true }).sort({ createdAt: -1 }).lean();
    const resp = { success: true, data: news.length > 0 ? news : DEFAULT_NEWS };
    setCached(cacheKey, resp, 60);
    return NextResponse.json(resp, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching news';
    console.error('[API News GET Error]:', message);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    const body = await req.json();
    if (!body.text || typeof body.text !== 'string' || !body.text.trim()) {
      return NextResponse.json({ success: false, error: 'News text is required' }, { status: 400 });
    }

    const id = body.id || Date.now().toString();
    const item = await NewsModel.findOneAndUpdate(
      { id },
      { id, text: body.text.trim(), active: true },
      { upsert: true, new: true }
    );

    clearCache('news_');
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error adding news';
    console.error('[API News POST Error]:', message);
    return NextResponse.json({ success: false, error: 'Failed to save news' }, { status: 500 });
  }
}
