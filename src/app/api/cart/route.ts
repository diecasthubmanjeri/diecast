import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CartModel } from '@/models/Cart';
import { ProductModel } from '@/models/Product';
import { CartAnalyticsModel } from '@/models/CartAnalytics';
import { getOrCreateSessionId, attachSessionCookie } from '@/lib/session';
import {
  getFallbackCart,
  saveFallbackCart,
  recordFallbackCartAddition,
  getFallbackProducts,
} from '@/lib/fallbackStorage';

export async function GET(req: NextRequest) {
  try {
    const { sessionId, isNew } = getOrCreateSessionId(req);
    const db = await connectDB();
    if (!db) {
      const items = getFallbackCart(sessionId);
      const fallbackProds = getFallbackProducts();
      const enriched = items.map((item) => {
        const prod = fallbackProds.find((p) => p.id === item.id || p.slug === item.id);
        const liveStock = prod ? (prod.isPreorder ? 99 : Math.max(0, prod.stock)) : (item.stock ?? 99);
        const finalQty = liveStock > 0 ? Math.min(item.quantity, liveStock) : item.quantity;
        return {
          ...item,
          quantity: finalQty,
          stock: liveStock,
        };
      });
      saveFallbackCart(sessionId, enriched);
      const res = NextResponse.json({ success: true, items: enriched, source: 'fallback' });
      if (isNew) attachSessionCookie(res, sessionId);
      return res;
    }

    const cart = await CartModel.findOne({ sessionId });
    if (!cart) {
      const res = NextResponse.json({ success: true, items: [] });
      if (isNew) attachSessionCookie(res, sessionId);
      return res;
    }

    let cartModified = false;
    const enrichedItems = [];

    for (const item of cart.items) {
      const product = await ProductModel.findOne({ $or: [{ id: item.id }, { slug: item.id }] }).lean();
      const liveStock = product ? (product.isPreorder ? 99 : Math.max(0, product.stock)) : (item.stock ?? 99);
      let finalQty = item.quantity;
      if (liveStock > 0 && finalQty > liveStock) {
        finalQty = liveStock;
        item.quantity = liveStock;
        cartModified = true;
      }
      item.stock = liveStock;
      enrichedItems.push({
        id: item.id,
        name: item.name,
        scale: item.scale,
        price: item.price,
        quantity: finalQty,
        image: item.image,
        color: item.color,
        stock: liveStock,
      });
    }

    if (cartModified) {
      await cart.save();
    }

    const res = NextResponse.json({
      success: true,
      items: enrichedItems,
    });

    if (isNew) attachSessionCookie(res, sessionId);
    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Cart error';
    console.error('[API Cart GET Error]:', message);
    return NextResponse.json({ success: false, items: [], error: 'Failed to load cart' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, isNew } = getOrCreateSessionId(req);
    const body = await req.json();
    const { id, name, scale, price, quantity = 1, image, color } = body;

    if (!id || !name || price === undefined) {
      return NextResponse.json({ success: false, error: 'Invalid cart item payload' }, { status: 400 });
    }

    const db = await connectDB();
    if (!db) {
      // Fallback mode
      const fallbackProds = getFallbackProducts();
      const product = fallbackProds.find((p) => p.id === id || p.slug === id);
      const availableStock = product ? (product.isPreorder ? 99 : Math.max(0, product.stock)) : 99;
      const currentItems = getFallbackCart(sessionId);

      // Enforce server-authoritative price to prevent client tampering
      const authoritativePrice = product
        ? (product.isPreorder && product.preorderAmount && product.preorderAmount > 0 ? product.preorderAmount : product.price)
        : Math.max(0, Number(price) || 0);

      const existingIndex = currentItems.findIndex(
        (item) => item.id === id && (item.color || '') === (color || '')
      );

      let stockExceeded = false;
      if (existingIndex > -1) {
        const targetQty = currentItems[existingIndex].quantity + Number(quantity);
        if (targetQty > availableStock) {
          stockExceeded = true;
          currentItems[existingIndex].quantity = availableStock;
        } else {
          currentItems[existingIndex].quantity = targetQty;
        }
        currentItems[existingIndex].stock = availableStock;
        currentItems[existingIndex].price = authoritativePrice;
      } else {
        const targetQty = Number(quantity);
        if (targetQty > availableStock) {
          stockExceeded = true;
        }
        currentItems.push({
          id,
          name: product ? product.name : name,
          scale: (product && product.scale) || scale || '',
          price: authoritativePrice,
          quantity: Math.min(targetQty, availableStock),
          image: (product && product.image) || image || '',
          color: color || '',
          stock: availableStock,
        });
      }

      saveFallbackCart(sessionId, currentItems);

      // Record client cart addition analytics
      recordFallbackCartAddition(
        id,
        product ? product.name : name,
        (product && product.image) || image || '',
        (product && product.scale) || scale || '',
        product ? product.brand : '',
        authoritativePrice,
        sessionId
      );

      const res = NextResponse.json({
        success: !stockExceeded,
        error: stockExceeded ? 'Stock reached maximum limit' : undefined,
        items: currentItems,
        source: 'fallback',
      });
      if (isNew) attachSessionCookie(res, sessionId);
      return res;
    }

    // Check available stock and authoritative price from ProductModel
    const product = await ProductModel.findOne({ $or: [{ id }, { slug: id }] });
    const availableStock = product ? (product.isPreorder ? 99 : Math.max(0, product.stock)) : 99;

    const authoritativePrice = product
      ? (product.isPreorder && product.preorderAmount && product.preorderAmount > 0 ? product.preorderAmount : product.price)
      : Math.max(0, Number(price) || 0);

    let cart = await CartModel.findOne({ sessionId });
    if (!cart) {
      cart = new CartModel({ sessionId, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.id === id && (item.color || '') === (color || '')
    );

    let stockExceeded = false;
    if (existingIndex > -1) {
      const targetQty = cart.items[existingIndex].quantity + Number(quantity);
      if (targetQty > availableStock) {
        stockExceeded = true;
        cart.items[existingIndex].quantity = availableStock;
      } else {
        cart.items[existingIndex].quantity = targetQty;
      }
      cart.items[existingIndex].stock = availableStock;
      cart.items[existingIndex].price = authoritativePrice;
    } else {
      const targetQty = Number(quantity);
      if (targetQty > availableStock) {
        stockExceeded = true;
      }
      cart.items.push({
        id,
        name: product ? product.name : name,
        scale: (product && product.scale) || scale || '',
        price: authoritativePrice,
        quantity: Math.min(targetQty, availableStock),
        image: (product && product.image) || image || '',
        color: color || '',
        stock: availableStock,
      });
    }

    await cart.save();

    // Track in CartAnalytics
    try {
      await CartAnalyticsModel.findOneAndUpdate(
        { productId: id },
        {
          $set: {
            productName: name,
            productImage: image || (product ? product.image : ''),
            productScale: scale || (product ? product.scale : ''),
            productBrand: product ? product.brand : '',
            productPrice: Number(price),
            lastAddedAt: new Date(),
          },
          $addToSet: { clientSessionIds: sessionId },
          $inc: { totalAdditions: 1 },
        },
        { upsert: true, new: true }
      );

      const statDoc = await CartAnalyticsModel.findOne({ productId: id });
      if (statDoc) {
        statDoc.uniqueClientsCount = statDoc.clientSessionIds.length;
        await statDoc.save();
      }
    } catch (analyticsErr) {
      console.warn('[Cart Analytics Warning]:', analyticsErr);
    }

    const res = NextResponse.json({
      success: !stockExceeded,
      error: stockExceeded ? 'Stock reached maximum limit' : undefined,
      items: cart.items,
    });
    if (isNew) attachSessionCookie(res, sessionId);
    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Cart error';
    console.error('[API Cart POST Error]:', message);
    return NextResponse.json({ success: false, error: 'Failed to add item to cart' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { sessionId, isNew } = getOrCreateSessionId(req);
    const body = await req.json();
    const { id, quantity } = body;

    if (!id || quantity === undefined) {
      return NextResponse.json({ success: false, error: 'Item ID and quantity required' }, { status: 400 });
    }

    const db = await connectDB();
    if (!db) {
      const fallbackProds = getFallbackProducts();
      const product = fallbackProds.find((p) => p.id === id || p.slug === id);
      const availableStock = product ? (product.isPreorder ? 99 : Math.max(0, product.stock)) : 99;

      const currentItems = getFallbackCart(sessionId);
      let updatedItems: any[];
      let stockExceeded = false;

      if (Number(quantity) <= 0) {
        updatedItems = currentItems.filter((item) => item.id !== id);
      } else {
        const item = currentItems.find((i) => i.id === id);
        if (item) {
          const reqQty = Number(quantity);
          if (reqQty > availableStock) {
            stockExceeded = true;
            item.quantity = availableStock;
          } else {
            item.quantity = reqQty;
          }
          item.stock = availableStock;
        }
        updatedItems = currentItems;
      }

      saveFallbackCart(sessionId, updatedItems);
      const res = NextResponse.json({
        success: !stockExceeded,
        error: stockExceeded ? 'Stock reached maximum limit' : undefined,
        items: updatedItems,
        source: 'fallback',
      });
      if (isNew) attachSessionCookie(res, sessionId);
      return res;
    }

    const product = await ProductModel.findOne({ $or: [{ id }, { slug: id }] });
    const availableStock = product ? (product.isPreorder ? 99 : Math.max(0, product.stock)) : 99;

    const cart = await CartModel.findOne({ sessionId });
    if (!cart) {
      const res = NextResponse.json({ success: true, items: [] });
      if (isNew) attachSessionCookie(res, sessionId);
      return res;
    }

    let stockExceeded = false;
    const reqQty = Number(quantity);

    if (reqQty <= 0) {
      cart.items = cart.items.filter((item) => item.id !== id);
    } else {
      const existingItem = cart.items.find((item) => item.id === id);
      if (existingItem) {
        if (reqQty > availableStock) {
          stockExceeded = true;
          existingItem.quantity = availableStock;
        } else {
          existingItem.quantity = reqQty;
        }
        existingItem.stock = availableStock;
      }
    }

    await cart.save();

    const res = NextResponse.json({
      success: !stockExceeded,
      error: stockExceeded ? 'Stock reached maximum limit' : undefined,
      items: cart.items,
    });
    if (isNew) attachSessionCookie(res, sessionId);
    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Cart error';
    console.error('[API Cart PATCH Error]:', message);
    return NextResponse.json({ success: false, error: 'Failed to update quantity' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { sessionId, isNew } = getOrCreateSessionId(req);
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('id');

    const db = await connectDB();
    if (!db) {
      let currentItems = getFallbackCart(sessionId);
      if (itemId) {
        currentItems = currentItems.filter((item) => item.id !== itemId);
      } else {
        currentItems = [];
      }
      saveFallbackCart(sessionId, currentItems);
      const res = NextResponse.json({ success: true, items: currentItems, source: 'fallback' });
      if (isNew) attachSessionCookie(res, sessionId);
      return res;
    }

    let cart = await CartModel.findOne({ sessionId });
    if (cart) {
      if (itemId) {
        cart.items = cart.items.filter((item) => item.id !== itemId);
      } else {
        cart.items = [];
      }
      await cart.save();
    }

    const res = NextResponse.json({ success: true, items: cart ? cart.items : [] });
    if (isNew) attachSessionCookie(res, sessionId);
    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Cart error';
    console.error('[API Cart DELETE Error]:', message);
    return NextResponse.json({ success: false, error: 'Failed to clear cart' }, { status: 500 });
  }
}

