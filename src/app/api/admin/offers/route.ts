import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { OfferModel } from '@/models/Offer';
import {
  getFallbackOffers,
  saveFallbackOffer,
  deleteFallbackOffer,
  toggleFallbackOffer,
} from '@/lib/fallbackStorage';
import { clearCache } from '@/lib/cache';
import { checkAdminAuth } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const db = await connectDB();
    if (!db) {
      const offers = getFallbackOffers(false);
      return NextResponse.json({ success: true, count: offers.length, data: offers, source: 'fallback' });
    }

    const offers = await OfferModel.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, count: offers.length, data: offers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching admin offers';
    console.error('[API Admin Offers GET Error]:', message);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const body = await req.json();
    const { minPurchaseAmount, discountPercentage, title, description, isActive = true } = body;

    const minAmount = Number(minPurchaseAmount);
    const discPct = Number(discountPercentage);

    if (isNaN(minAmount) || minAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid purchase amount greater than 0.' },
        { status: 400 }
      );
    }

    if (isNaN(discPct) || discPct < 1 || discPct > 100) {
      return NextResponse.json(
        { success: false, error: 'Offer percentage must be between 1% and 100%.' },
        { status: 400 }
      );
    }

    const offerTitle =
      title && title.trim()
        ? title.trim()
        : `${discPct}% OFF on orders ₹${minAmount.toLocaleString('en-IN')}+`;

    const db = await connectDB();
    if (!db) {
      const created = saveFallbackOffer({
        minPurchaseAmount: minAmount,
        discountPercentage: discPct,
        title: offerTitle,
        description: description || '',
        isActive,
      });
      return NextResponse.json({ success: true, data: created, source: 'fallback' }, { status: 201 });
    }

    const offerId = `OFFER_${Date.now()}`;
    const newOffer = await OfferModel.create({
      id: offerId,
      minPurchaseAmount: minAmount,
      discountPercentage: discPct,
      title: offerTitle,
      description: description || '',
      isActive: Boolean(isActive),
    });

    clearCache('public_active_offers');
    return NextResponse.json({ success: true, data: newOffer }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error saving offer';
    console.error('[API Admin Offers POST Error]:', message);
    return NextResponse.json({ success: false, error: 'Failed to create offer.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const body = await req.json();
    const { id, isActive, minPurchaseAmount, discountPercentage, title, description } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Offer ID is required.' }, { status: 400 });
    }

    const db = await connectDB();
    if (!db) {
      if (isActive !== undefined) {
        const updated = toggleFallbackOffer(id, Boolean(isActive));
        if (!updated) return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: updated, source: 'fallback' });
      }
      return NextResponse.json({ success: true, source: 'fallback' });
    }

    const updates: Record<string, any> = {};
    if (isActive !== undefined) updates.isActive = Boolean(isActive);
    if (minPurchaseAmount !== undefined) updates.minPurchaseAmount = Number(minPurchaseAmount);
    if (discountPercentage !== undefined) updates.discountPercentage = Number(discountPercentage);
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const filter = isObjectId ? { $or: [{ id }, { _id: id }] } : { id };

    const updatedOffer = await OfferModel.findOneAndUpdate(
      filter,
      { $set: updates },
      { new: true }
    );

    if (!updatedOffer) {
      return NextResponse.json({ success: false, error: 'Offer not found.' }, { status: 404 });
    }

    clearCache('public_active_offers');
    return NextResponse.json({ success: true, data: updatedOffer });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating offer';
    console.error('[API Admin Offers PATCH Error]:', message);
    return NextResponse.json({ success: false, error: 'Failed to update offer.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Offer ID is required.' }, { status: 400 });
    }

    const db = await connectDB();
    if (!db) {
      const deleted = deleteFallbackOffer(id);
      clearCache('public_active_offers');
      return NextResponse.json({ success: deleted, source: 'fallback' });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const filter = isObjectId ? { $or: [{ id }, { _id: id }] } : { id };
    const res = await OfferModel.deleteOne(filter);
    clearCache('public_active_offers');
    return NextResponse.json({ success: res.deletedCount > 0 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting offer';
    console.error('[API Admin Offers DELETE Error]:', message);
    return NextResponse.json({ success: false, error: 'Failed to delete offer.' }, { status: 500 });
  }
}
