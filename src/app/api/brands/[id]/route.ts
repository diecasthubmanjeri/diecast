import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { BrandModel } from '@/models/Brand';
import mongoose from 'mongoose';
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

    const decodedId = decodeURIComponent(id);
    const body = await req.json();

    const query = mongoose.Types.ObjectId.isValid(decodedId)
      ? { $or: [{ _id: decodedId }, { name: decodedId }] }
      : { name: decodedId };

    const updated = await BrandModel.findOneAndUpdate(
      query,
      { $set: { ...(body.name && { name: body.name.trim() }), ...(body.logo !== undefined && { logo: body.logo }) } },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Brand not found' }, { status: 404 });
    }

    clearCache('brands_');
    try {
      const { revalidatePath } = require('next/cache');
      revalidatePath('/', 'page');
      revalidatePath('/catalog', 'page');
    } catch (e) {
      console.warn(e);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating brand';
    console.error('[API Brand PUT Error]:', message);
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

    const decodedId = decodeURIComponent(id);
    const query = mongoose.Types.ObjectId.isValid(decodedId)
      ? { $or: [{ _id: decodedId }, { name: decodedId }] }
      : { name: decodedId };

    const deleted = await BrandModel.findOneAndDelete(query);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Brand not found' }, { status: 404 });
    }

    clearCache('brands_');
    try {
      const { revalidatePath } = require('next/cache');
      revalidatePath('/', 'page');
      revalidatePath('/catalog', 'page');
    } catch (e) {
      console.warn(e);
    }

    return NextResponse.json({ success: true, message: 'Brand deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting brand';
    console.error('[API Brand DELETE Error]:', message);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
