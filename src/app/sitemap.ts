import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/siteConfig';
import { connectDB } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { getFallbackProducts } from '@/lib/fallbackStorage';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/catalog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/diecast-cars-manjeri`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/orders`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // Dynamic product routes
  let products: { slug?: string; id?: string; updatedAt?: Date | string }[] = [];

  try {
    const db = await connectDB();
    if (db) {
      const dbProducts = await ProductModel.find({}, 'slug id updatedAt').lean();
      products = dbProducts.map((p) => ({
        slug: p.slug,
        id: p.id,
        updatedAt: p.updatedAt,
      }));
    } else {
      const fbProducts = getFallbackProducts();
      products = fbProducts.map((p) => ({
        slug: p.slug,
        id: p.id,
        updatedAt: now,
      }));
    }
  } catch (err) {
    console.error('[Sitemap generation error]:', err);
    const fbProducts = getFallbackProducts();
    products = fbProducts.map((p) => ({
      slug: p.slug,
      id: p.id,
      updatedAt: now,
    }));
  }

  const productRoutes: MetadataRoute.Sitemap = products
    .filter((p) => Boolean(p.slug || p.id))
    .map((prod) => ({
      url: `${SITE_URL}/product/${encodeURIComponent(prod.slug || prod.id || '')}`,
      lastModified: prod.updatedAt ? new Date(prod.updatedAt) : now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  return [...staticRoutes, ...productRoutes];
}
