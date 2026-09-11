import { BrandModel } from '../models/Brand';
import { CategoryModel } from '../models/Category';
import { ScaleModel } from '../models/Scale';
import { NewsModel } from '../models/News';
import { BannerModel } from '../models/Banner';
import { defaultBrands, defaultCategories, defaultScales } from '../data/products';

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

const DEFAULT_NEWS = [
  { id: '1', text: '🚨 Big Sale: Up to 50% off on all 1/18 scale models!' },
  { id: '2', text: '🚗 New arrivals from Hot Wheels and Matchbox just landed!' },
  { id: '3', text: '✨ Free shipping on orders over ₹2000!' },
  { id: '4', text: '🔥 Pre-order the exclusive 2024 limited editions now!' },
];

declare global {
  // eslint-disable-next-line no-var
  var __isDbSeeded: boolean | undefined;
  // eslint-disable-next-line no-var
  var __dbSeedingPromise: Promise<void> | null | undefined;
}

export async function seedInitialDataIfNeeded() {
  if (global.__isDbSeeded) {
    return;
  }

  if (global.__dbSeedingPromise) {
    return global.__dbSeedingPromise;
  }

  global.__dbSeedingPromise = (async () => {
    try {
      // Note: Product auto-seeding is disabled so only user-added products exist in the store.

      // 2. Seed Brands if empty
      const brandCount = await BrandModel.countDocuments();
      if (brandCount === 0) {
        console.log('[Seed] Seeding initial brands...');
        const brandOps = defaultBrands.map((b) => ({
          updateOne: {
            filter: { name: b.name },
            update: { $setOnInsert: b },
            upsert: true,
          },
        }));
        await BrandModel.bulkWrite(brandOps, { ordered: false });
      }

      // 3. Seed Categories if empty
      const categoryCount = await CategoryModel.countDocuments();
      if (categoryCount === 0) {
        console.log('[Seed] Seeding initial categories...');
        const catOps = defaultCategories.map((c) => ({
          updateOne: {
            filter: { name: c.name },
            update: { $setOnInsert: c },
            upsert: true,
          },
        }));
        await CategoryModel.bulkWrite(catOps, { ordered: false });
      }

      // 4. Seed Scales if empty
      const scaleCount = await ScaleModel.countDocuments();
      if (scaleCount === 0) {
        console.log('[Seed] Seeding initial scales...');
        const scaleOps = defaultScales.map((name) => ({
          updateOne: {
            filter: { name },
            update: { $setOnInsert: { name } },
            upsert: true,
          },
        }));
        await ScaleModel.bulkWrite(scaleOps, { ordered: false });
      }

      // 5. Seed News if empty
      const newsCount = await NewsModel.countDocuments();
      if (newsCount === 0) {
        console.log('[Seed] Seeding initial news...');
        const newsOps = DEFAULT_NEWS.map((n) => ({
          updateOne: {
            filter: { id: n.id },
            update: { $setOnInsert: n },
            upsert: true,
          },
        }));
        await NewsModel.bulkWrite(newsOps, { ordered: false });
      }

      // 6. Seed Banners if empty
      const bannerCount = await BannerModel.countDocuments();
      if (bannerCount === 0) {
        console.log('[Seed] Seeding initial banners...');
        const bannerOps = DEFAULT_BANNERS.map((b) => ({
          updateOne: {
            filter: { id: b.id },
            update: { $setOnInsert: b },
            upsert: true,
          },
        }));
        await BannerModel.bulkWrite(bannerOps, { ordered: false });
      }

      global.__isDbSeeded = true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Seed] Error during seeding:', message);
    } finally {
      global.__dbSeedingPromise = null;
    }
  })();

  return global.__dbSeedingPromise;
}
