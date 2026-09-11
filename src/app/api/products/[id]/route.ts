import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { mockProducts } from '@/data/products';
import mongoose from 'mongoose';
import {
  getFallbackProductById,
  updateFallbackProduct,
  deleteFallbackProduct,
} from '@/lib/fallbackStorage';
import { checkAdminAuth } from '@/lib/adminAuth';
import { clearCache } from '@/lib/cache';
import { revalidatePath } from 'next/cache';

function buildProductQuery(id: string) {
  const decoded = decodeURIComponent(id).trim();
  const conditions: Array<Record<string, unknown>> = [{ id: decoded }, { slug: decoded }];
  if (mongoose.Types.ObjectId.isValid(decoded)) {
    conditions.push({ _id: decoded });
  }
  return { $or: conditions };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await connectDB();
    if (!db) {
      const fallback = getFallbackProductById(id) || mockProducts.find((p) => p.id === id || p.slug === id);
      if (!fallback) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: fallback, source: 'fallback' });
    }

    const query = buildProductQuery(id);
    const product = await ProductModel.findOne(query).lean();

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching product';
    console.error('[API Product GET Error]:', message);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    if (body.price !== undefined && (typeof body.price !== 'number' || body.price < 0)) {
      return NextResponse.json({ success: false, error: 'Price must be a positive number' }, { status: 400 });
    }

    if (body.stock !== undefined && (typeof body.stock !== 'number' || body.stock < 0)) {
      return NextResponse.json({ success: false, error: 'Stock must be a non-negative number' }, { status: 400 });
    }

    const db = await connectDB();
    if (!db) {
      const updated = updateFallbackProduct(id, body);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updated, source: 'fallback' });
    }

    const query = buildProductQuery(id);
    const updated = await ProductModel.findOneAndUpdate(
      query,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    clearCache('products_');
    try {
      revalidatePath('/', 'page');
      revalidatePath('/catalog', 'page');
      revalidatePath('/product/[slug]', 'page');
      if (updated.slug) revalidatePath(`/product/${updated.slug}`, 'page');
      if (updated.id) revalidatePath(`/product/${updated.id}`, 'page');
    } catch (revalErr) {
      console.warn('[Revalidation Warning]:', revalErr);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating product';
    console.error('[API Product PUT Error]:', message);
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
      const deleted = deleteFallbackProduct(id);
      if (!deleted) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
      }
      clearCache('products_');
      return NextResponse.json({ success: true, message: 'Product deleted successfully', count: 1, source: 'fallback' });
    }

    const query = buildProductQuery(id);
    const result = await ProductModel.deleteMany(query);

    if (!result || result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    clearCache('products_');
    return NextResponse.json({ success: true, message: 'Product deleted successfully', count: result.deletedCount });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting product';
    console.error('[API Product DELETE Error]:', message);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
