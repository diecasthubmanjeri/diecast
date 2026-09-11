import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CartAnalyticsModel } from '@/models/CartAnalytics';
import { CartModel } from '@/models/Cart';
import { ProductModel } from '@/models/Product';
import {
  getFallbackCartAnalytics,
  getFallbackProducts,
} from '@/lib/fallbackStorage';
import { checkAdminAuth } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  try {
    if (!checkAdminAuth(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const db = await connectDB();

    if (!db) {
      const fallbackAnalytics = getFallbackCartAnalytics();
      const fallbackProducts = getFallbackProducts();

      // Build combined map
      const analyticsMap = new Map<string, any>();
      fallbackAnalytics.forEach((item) => {
        analyticsMap.set(item.productId, item);
      });

      const combined = fallbackProducts.map((prod) => {
        const stat = analyticsMap.get(prod.id) || analyticsMap.get(prod.slug) || {
          uniqueClientsCount: 0,
          totalAdditions: 0,
          clientSessionIds: [],
          lastAddedAt: null,
        };

        return {
          productId: prod.id,
          productName: prod.name,
          productImage: prod.image,
          productBrand: prod.brand,
          productScale: prod.scale,
          productPrice: prod.price,
          stock: prod.stock,
          isBestseller: Boolean(prod.isBestseller),
          uniqueClientsCount: stat.uniqueClientsCount || 0,
          totalAdditions: stat.totalAdditions || 0,
          lastAddedAt: stat.lastAddedAt,
        };
      });

      // Also include any analytics items that might not have a direct product match
      fallbackAnalytics.forEach((stat) => {
        if (!combined.some((p) => p.productId === stat.productId)) {
          combined.push({
            productId: stat.productId,
            productName: stat.productName,
            productImage: stat.productImage || '',
            productBrand: stat.productBrand || '',
            productScale: stat.productScale || '',
            productPrice: stat.productPrice || 0,
            stock: 0,
            isBestseller: false,
            uniqueClientsCount: stat.uniqueClientsCount || 0,
            totalAdditions: stat.totalAdditions || 0,
            lastAddedAt: stat.lastAddedAt,
          });
        }
      });

      // Sort by unique clients descending, then total additions
      combined.sort((a, b) => {
        if (b.uniqueClientsCount !== a.uniqueClientsCount) {
          return b.uniqueClientsCount - a.uniqueClientsCount;
        }
        return b.totalAdditions - a.totalAdditions;
      });

      const totalClientsEngaged = new Set(
        fallbackAnalytics.flatMap((a) => a.clientSessionIds || [])
      ).size;
      const totalCartAdditions = fallbackAnalytics.reduce(
        (sum, a) => sum + (a.totalAdditions || 0),
        0
      );

      return NextResponse.json({
        success: true,
        source: 'fallback',
        data: {
          items: combined,
          summary: {
            topMovingProduct: combined[0] || null,
            totalClientsEngaged,
            totalCartAdditions,
            totalTrackedProducts: combined.length,
          },
        },
      });
    }

    // MongoDB connected mode
    const [analyticsList, productsList] = await Promise.all([
      CartAnalyticsModel.find({}).lean(),
      ProductModel.find({}).lean(),
    ]);

    const analyticsMap = new Map<string, any>();
    analyticsList.forEach((stat) => {
      analyticsMap.set(stat.productId, stat);
    });

    const combined = productsList.map((prod) => {
      const stat = analyticsMap.get(prod.id) || analyticsMap.get(prod.slug) || {
        uniqueClientsCount: 0,
        totalAdditions: 0,
        clientSessionIds: [],
        lastAddedAt: null,
      };

      return {
        productId: prod.id,
        productName: prod.name,
        productImage: prod.image,
        productBrand: prod.brand,
        productScale: prod.scale,
        productPrice: prod.price,
        stock: prod.stock,
        isBestseller: Boolean(prod.isBestseller),
        uniqueClientsCount: stat.uniqueClientsCount || 0,
        totalAdditions: stat.totalAdditions || 0,
        lastAddedAt: stat.lastAddedAt,
      };
    });

    analyticsList.forEach((stat) => {
      if (!combined.some((p) => p.productId === stat.productId)) {
        combined.push({
          productId: stat.productId,
          productName: stat.productName,
          productImage: stat.productImage || '',
          productBrand: stat.productBrand || '',
          productScale: stat.productScale || '',
          productPrice: stat.productPrice || 0,
          stock: 0,
          isBestseller: false,
          uniqueClientsCount: stat.uniqueClientsCount || 0,
          totalAdditions: stat.totalAdditions || 0,
          lastAddedAt: stat.lastAddedAt,
        });
      }
    });

    combined.sort((a, b) => {
      if (b.uniqueClientsCount !== a.uniqueClientsCount) {
        return b.uniqueClientsCount - a.uniqueClientsCount;
      }
      return b.totalAdditions - a.totalAdditions;
    });

    const allClientSessions = new Set<string>();
    let totalCartAdditions = 0;
    analyticsList.forEach((a) => {
      if (Array.isArray(a.clientSessionIds)) {
        a.clientSessionIds.forEach((s: string) => allClientSessions.add(s));
      }
      totalCartAdditions += a.totalAdditions || 0;
    });

    return NextResponse.json({
      success: true,
      data: {
        items: combined,
        summary: {
          topMovingProduct: combined[0] || null,
          totalClientsEngaged: allClientSessions.size,
          totalCartAdditions,
          totalTrackedProducts: combined.length,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching bestselling stats';
    console.error('[API Admin BestSelling GET Error]:', message);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
