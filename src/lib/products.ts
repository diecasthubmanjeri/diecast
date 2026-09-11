import { cache } from 'react';
import { connectDB } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { getFallbackProductById, getFallbackProducts } from '@/lib/fallbackStorage';
import { Product } from '@/data/products';
import mongoose from 'mongoose';

export const fetchProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  if (!slug) return null;
  const decoded = decodeURIComponent(slug).trim();

  try {
    const db = await connectDB();
    if (db) {
      const conditions: Array<Record<string, unknown>> = [{ id: decoded }, { slug: decoded }];
      if (mongoose.Types.ObjectId.isValid(decoded)) {
        conditions.push({ _id: decoded });
      }
      const prod = await ProductModel.findOne({ $or: conditions }).lean();
      if (prod) {
        return JSON.parse(JSON.stringify(prod)) as Product;
      }
    }
  } catch (e) {
    console.error('[fetchProductBySlug DB error]:', e);
  }

  const fb = getFallbackProductById(decoded);
  if (fb) return fb;
  const allFb = getFallbackProducts();
  return allFb.find((p) => p.slug === decoded || p.id === decoded) || null;
});
