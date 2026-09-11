import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { OfferModel } from '@/models/Offer';
import { getFallbackOffers } from '@/lib/fallbackStorage';
import { getCached, setCached } from '@/lib/cache';

export async function GET() {
  try {
    const cacheKey = 'public_active_offers';
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
      });
    }

    const db = await connectDB();
    if (!db) {
      const offers = getFallbackOffers(true);
      const resp = { success: true, data: offers, source: 'fallback' };
      setCached(cacheKey, resp, 20);
      return NextResponse.json(resp, {
        headers: { 'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=60' },
      });
    }

    const offers = await OfferModel.find({ isActive: true })
      .sort({ minPurchaseAmount: -1 })
      .lean();

    const resp = { success: true, data: offers };
    setCached(cacheKey, resp, 30);
    return NextResponse.json(resp, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching offers';
    console.error('[API Offers GET Error]:', message);
    return NextResponse.json({ success: false, error: 'Failed to load offers' }, { status: 500 });
  }
}
