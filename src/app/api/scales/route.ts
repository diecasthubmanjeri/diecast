import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ScaleModel } from '@/models/Scale';
import { seedInitialDataIfNeeded } from '@/lib/seed';
import { defaultScales } from '@/data/products';
import { getCached, setCached, clearCache } from '@/lib/cache';
import { checkAdminAuth } from '@/lib/adminAuth';

export async function GET() {
  try {
    const cacheKey = 'scales_all';
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
      });
    }

    const db = await connectDB();
    if (!db) {
      const resp = { success: true, data: defaultScales };
      setCached(cacheKey, resp, 60);
      return NextResponse.json(resp, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
      });
    }

    await seedInitialDataIfNeeded();
    const scales = await ScaleModel.find({}).sort({ createdAt: 1 }).lean();
    const resp = { success: true, data: scales.map((s) => s.name) };
    setCached(cacheKey, resp, 60);
    return NextResponse.json(resp, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching scales';
    console.error('[API Scales GET Error]:', message);
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
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ success: false, error: 'Scale name is required' }, { status: 400 });
    }

    const scaleName = body.name.trim();
    const existing = await ScaleModel.findOne({ name: scaleName });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Scale already exists' }, { status: 409 });
    }

    const scale = await ScaleModel.create({ name: scaleName });
    clearCache('scales_');
    return NextResponse.json({ success: true, data: scale.name }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error adding scale';
    console.error('[API Scales POST Error]:', message);
    return NextResponse.json({ success: false, error: 'Failed to add scale' }, { status: 500 });
  }
}
