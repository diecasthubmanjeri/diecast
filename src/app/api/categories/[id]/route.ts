import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CategoryModel } from '@/models/Category';
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

    const updated = await CategoryModel.findOneAndUpdate(
      query,
      {
        $set: {
          ...(body.name && { name: body.name.trim() }),
          ...(body.image !== undefined && { image: body.image }),
          ...(body.subtitle !== undefined && { subtitle: body.subtitle }),
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    clearCache('categories_');
    try {
      const { revalidatePath } = require('next/cache');
      revalidatePath('/', 'page');
      revalidatePath('/catalog', 'page');
    } catch (e) {
      console.warn(e);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating category';
    console.error('[API Category PUT Error]:', message);
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

    const deleted = await CategoryModel.findOneAndDelete(query);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    clearCache('categories_');
    try {
      const { revalidatePath } = require('next/cache');
      revalidatePath('/', 'page');
      revalidatePath('/catalog', 'page');
    } catch (e) {
      console.warn(e);
    }

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting category';
    console.error('[API Category DELETE Error]:', message);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
