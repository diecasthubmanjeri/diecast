import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { ScaleModel } from '@/models/Scale';
import { BrandModel } from '@/models/Brand';
import { CategoryModel } from '@/models/Category';
import { seedInitialDataIfNeeded } from '@/lib/seed';
import { getFallbackProducts, saveFallbackProduct } from '@/lib/fallbackStorage';
import { getCached, setCached, clearCache } from '@/lib/cache';
import { checkAdminAuth } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const scale = searchParams.get('scale');
    const q = searchParams.get('q');
    const preorder = searchParams.get('preorder');
    const inStock = searchParams.get('inStock');

    const cacheKey = `products_${req.url}`;
    const cachedData = getCached<any>(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=60',
        },
      });
    }

    const db = await connectDB();
    if (!db) {
      // Fallback mode if DB is not connected
      const fallbackList = getFallbackProducts({ category, brand, scale, q, preorder, inStock });
      const resp = { success: true, count: fallbackList.length, data: fallbackList, source: 'fallback' };
      setCached(cacheKey, resp, 15);
      return NextResponse.json(resp, {
        headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
      });
    }

    // Build safe query filter (NoSQL injection safe)
    const filter: Record<string, any> = {};

    if (category) {
      filter.category = { $regex: new RegExp(`^${category.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') };
    }
    if (brand) {
      const sanitizedBrand = brand.replace(/[-_\s]/g, '[-_\\s]');
      filter.brand = { $regex: new RegExp(`^${sanitizedBrand}$`, 'i') };
    }
    if (scale) {
      const sanitizedScale = scale.replace(/[-:]/g, '[-:]');
      filter.scale = { $regex: new RegExp(`^${sanitizedScale}$`, 'i') };
    }
    if (preorder === 'true') {
      filter.isPreorder = true;
    } else if (preorder === 'false') {
      filter.isPreorder = false;
    }
    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
    }

    if (q && q.trim()) {
      const sanitizedQ = q.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      filter.$or = [
        { name: { $regex: sanitizedQ, $options: 'i' } },
        { brand: { $regex: sanitizedQ, $options: 'i' } },
        { model: { $regex: sanitizedQ, $options: 'i' } },
        { category: { $regex: sanitizedQ, $options: 'i' } },
      ];
    }

    const rawProducts = await ProductModel.find(filter).sort({ createdAt: -1 }).lean();

    // Ensure distinct products by id or slug
    const seen = new Set<string>();
    const products: typeof rawProducts = [];
    for (const p of rawProducts) {
      const key = p.id || (p as unknown as { _id?: string })._id?.toString() || p.slug;
      if (key && !seen.has(key)) {
        seen.add(key);
        products.push(p);
      }
    }

    const responsePayload = { success: true, count: products.length, data: products };
    setCached(cacheKey, responsePayload, 30);

    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching products';
    console.error('[API Products GET Error]:', message);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const body = await req.json();

    // Strict input validation
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Product name is required.' }, { status: 400 });
    }

    if (body.price === undefined || typeof body.price !== 'number' || body.price < 0) {
      return NextResponse.json({ success: false, error: 'Valid positive price is required.' }, { status: 400 });
    }

    if (body.stock === undefined || typeof body.stock !== 'number' || body.stock < 0) {
      return NextResponse.json({ success: false, error: 'Valid stock count is required.' }, { status: 400 });
    }

    if (!body.image || typeof body.image !== 'string') {
      return NextResponse.json({ success: false, error: 'Product image URL is required.' }, { status: 400 });
    }

    const db = await connectDB();
    if (!db) {
      const saved = saveFallbackProduct(body);
      return NextResponse.json({ success: true, data: saved, source: 'fallback' }, { status: 201 });
    }

    const id = body.id || Date.now().toString();
    const baseSlug = (body.slug || body.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    
    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    while (await ProductModel.exists({ slug, id: { $ne: id } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const newProduct = await ProductModel.findOneAndUpdate(
      { id },
      {
        id,
        name: body.name.trim(),
        slug,
        brand: body.brand || '',
        scale: body.scale || '',
        price: body.price,
        originalPrice: body.originalPrice || undefined,
        discount: body.discount || undefined,
        stock: body.stock,
        rating: typeof body.rating === 'number' ? body.rating : 5,
        reviews: typeof body.reviews === 'number' ? body.reviews : 0,
        model: body.model || '',
        category: body.category || '',
        image: body.image,
        gallery: Array.isArray(body.gallery) ? body.gallery : [],
        isNew: Boolean(body.isNew),
        isBestseller: Boolean(body.isBestseller),
        badge: body.badge || '',
        badgeTag: body.badgeTag || '',
        isPreorder: Boolean(body.isPreorder),
        releaseDate: body.releaseDate || '',
        preorderAmount: body.preorderAmount || 0,
        colors: Array.isArray(body.colors) ? body.colors : [],
        colorImages: Array.isArray(body.colorImages) ? body.colorImages : [],
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Automatically ensure scale, brand, and category exist in their collections
    try {
      if (body.scale && typeof body.scale === 'string' && body.scale.trim()) {
        await ScaleModel.updateOne(
          { name: body.scale.trim() },
          { $setOnInsert: { name: body.scale.trim() } },
          { upsert: true }
        );
      }
      if (body.brand && typeof body.brand === 'string' && body.brand.trim()) {
        await BrandModel.updateOne(
          { name: body.brand.trim() },
          { $setOnInsert: { name: body.brand.trim(), logo: '' } },
          { upsert: true }
        );
      }
      if (body.category && typeof body.category === 'string' && body.category.trim()) {
        await CategoryModel.updateOne(
          { name: body.category.trim() },
          { $setOnInsert: { name: body.category.trim(), image: '' } },
          { upsert: true }
        );
      }
    } catch (metaErr) {
      console.warn('[API Products POST] Error auto-registering metadata:', metaErr);
    }

    clearCache('products_');
    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error creating product';
    console.error('[API Products POST Error]:', message);
    return NextResponse.json({ success: false, error: 'Failed to create or update product' }, { status: 500 });
  }
}
