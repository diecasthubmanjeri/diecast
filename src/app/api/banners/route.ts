import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { BannerModel } from '@/models/Banner';
import { seedInitialDataIfNeeded } from '@/lib/seed';
import { checkAdminAuth } from '@/lib/adminAuth';

const DEFAULT_BANNERS = [
  {
    id: '1',
    italicTitle: '5% off on Minimum Order of 949.',
    mainTitle: '10% off on Minimum Order of 2000.',
    subTitle: 'Free Shipping on Prepaid Orders Above 949',
    promoEmoji: '🎁',
    noCouponText: 'No Coupon Code Required',
    order: 0,
    active: true,
  },
  {
    id: '2',
    italicTitle: 'Welcome to Diecast Hub.',
    mainTitle: 'Premium Models from Top Brands.',
    subTitle: 'Discover your next favorite collectible today.',
    promoEmoji: '🏎️',
    noCouponText: 'Shop Now',
    order: 1,
    active: true,
  },
];

export async function GET() {
  try {
    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ success: true, data: DEFAULT_BANNERS });
    }

    await seedInitialDataIfNeeded();
    const banners = await BannerModel.find({ active: true }).sort({ order: 1 }).lean();
    return NextResponse.json({ success: true, data: banners.length > 0 ? banners : DEFAULT_BANNERS });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching banners';
    console.error('[API Banners GET Error]:', message);
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
    if (Array.isArray(body)) {
      // Bulk update/replace banners
      await BannerModel.deleteMany({});
      const created = await BannerModel.insertMany(
        body.map((b, idx) => ({
          id: b.id || (idx + 1).toString(),
          italicTitle: b.italicTitle || '',
          mainTitle: b.mainTitle || '',
          subTitle: b.subTitle || '',
          promoEmoji: b.promoEmoji || '🏎️',
          noCouponText: b.noCouponText || 'No Coupon Code Required',
          order: idx,
          active: true,
        }))
      );
      return NextResponse.json({ success: true, data: created });
    }

    const id = body.id || Date.now().toString();
    const banner = await BannerModel.findOneAndUpdate(
      { id },
      {
        id,
        italicTitle: body.italicTitle || '',
        mainTitle: body.mainTitle || '',
        subTitle: body.subTitle || '',
        promoEmoji: body.promoEmoji || '🏎️',
        noCouponText: body.noCouponText || 'No Coupon Code Required',
        order: typeof body.order === 'number' ? body.order : 0,
        active: body.active !== undefined ? Boolean(body.active) : true,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: banner }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error saving banner';
    console.error('[API Banners POST Error]:', message);
    return NextResponse.json({ success: false, error: 'Failed to save banner' }, { status: 500 });
  }
}
