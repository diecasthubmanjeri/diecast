import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { BrandModel } from '@/models/Brand';
import { seedInitialDataIfNeeded } from '@/lib/seed';
import { defaultBrands } from '@/data/products';
import { getFallbackBrands, saveFallbackBrand } from '@/lib/fallbackStorage';
import { getCached, setCached, clearCache } from '@/lib/cache';
import { checkAdminAuth } from '@/lib/adminAuth';

export async function GET() {
  try {
    const cacheKey = 'brands_all';
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
      });
    }

    const db = await connectDB();
    if (!db) {
      const resp = { success: true, data: getFallbackBrands(), source: 'fallback' };
      setCached(cacheKey, resp, 60);
      return NextResponse.json(resp, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
      });
    }

    await seedInitialDataIfNeeded();
    const brands = await BrandModel.find({}).sort({ name: 1 }).lean();
    const resp = { success: true, data: brands };
    setCached(cacheKey, resp, 60);
    return NextResponse.json(resp, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching brands';
    console.error('[API Brands GET Error]:', message);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const body = await req.json();
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ success: false, error: 'Brand name is required' }, { status: 400 });
    }

    const brandName = body.name.trim();

    const db = await connectDB();
    if (!db) {
      const saved = saveFallbackBrand({ name: brandName, logo: body.logo || '' });
      if (!saved) {
        return NextResponse.json({ success: false, error: 'Brand already exists' }, { status: 409 });
      }
      return NextResponse.json({ success: true, data: saved, source: 'fallback' }, { status: 201 });
    }
    const existing = await BrandModel.findOne({ name: { $regex: new RegExp(`^${brandName}$`, 'i') } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Brand already exists' }, { status: 409 });
    }

    const brand = await BrandModel.create({
      name: brandName,
      logo: body.logo || '',
    });

    clearCache('brands_');
    return NextResponse.json({ success: true, data: brand }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error creating brand';
    console.error('[API Brands POST Error]:', message);
    return NextResponse.json({ success: false, error: 'Failed to create brand' }, { status: 500 });
  }
}
