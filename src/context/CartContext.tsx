'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export interface CartItem {
  id: string;
  name: string;
  scale: string;
  price: number;
  quantity: number;
  image: string;
  color?: string;
  stock?: number;
  isPreorder?: boolean;
}

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  isLoading: boolean;
  setIsCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch cart from database via session cookie on mount
  useEffect(() => {
    let isSubscribed = true;

    async function loadCart() {
      try {
        const res = await fetch('/api/cart', { cache: 'no-store' });
        const data = await res.json();
        if (isSubscribed && data.success && Array.isArray(data.items)) {
          setCartItems(data.items);
        }
      } catch (err) {
        console.error('[Cart] Failed to load cart from database:', err);
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    }

    loadCart();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const addToCart = useCallback(async (item: CartItem) => {
    // Check against available stock
    const existing = cartItems.find((i) => i.id === item.id);
    const availableStock = typeof item.stock === 'number' ? item.stock : existing?.stock;

    if (availableStock !== undefined && availableStock > 0) {
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty + item.quantity > availableStock) {
        toast('Stock reached maximum limit', { icon: 'ℹ️' });
        setIsCartOpen(true);
        return;
      }
    }

    // Optimistic UI update
    setCartItems((prev) => {
      const existingItem = prev.find((i) => i.id === item.id);
      if (existingItem) {
        const newQty = existingItem.quantity + item.quantity;
        return prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                quantity:
                  typeof availableStock === 'number' && availableStock > 0
                    ? Math.min(newQty, availableStock)
                    : newQty,
                stock: availableStock ?? i.stock,
              }
            : i
        );
      }
      return [...prev, item];
    });

    setIsCartOpen(true);

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (!data.success && data.error) {
        if (data.error.toLowerCase().includes('stock') || data.error.toLowerCase().includes('limit')) {
          toast('Stock reached maximum limit', { icon: 'ℹ️' });
        } else {
          toast.error(data.error);
        }
      }
      if (Array.isArray(data.items)) {
        setCartItems(data.items);
      }
    } catch (e) {
      console.error('[Cart] Failed to persist add to database:', e);
    }
  }, [cartItems]);

  const removeFromCart = useCallback(async (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));

    try {
      const res = await fetch(`/api/cart?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setCartItems(data.items);
      }
    } catch (e) {
      console.error('[Cart] Failed to remove item from database:', e);
    }
  }, []);

  const updateQuantity = useCallback(async (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    const currentItem = cartItems.find((i) => i.id === id);
    if (currentItem && typeof currentItem.stock === 'number' && currentItem.stock > 0) {
      if (quantity > currentItem.stock) {
        toast('Stock reached maximum limit', { icon: 'ℹ️' });
        return;
      }
    }

    setCartItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));

    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, quantity }),
      });
      const data = await res.json();
      if (!data.success && data.error) {
        if (data.error.toLowerCase().includes('stock') || data.error.toLowerCase().includes('limit')) {
          toast('Stock reached maximum limit', { icon: 'ℹ️' });
        } else {
          toast.error(data.error);
        }
      }
      if (Array.isArray(data.items)) {
        setCartItems(data.items);
      }
    } catch (e) {
      console.error('[Cart] Failed to update item quantity in database:', e);
    }
  }, [cartItems, removeFromCart]);

  const clearCart = useCallback(async () => {
    setCartItems([]);
    try {
      await fetch('/api/cart', { method: 'DELETE' });
    } catch (e) {
      console.error('[Cart] Failed to clear cart in database:', e);
    }
  }, []);

  return (
    <CartContext.Provider value={{
      cartItems,
      isCartOpen,
      isLoading,
      setIsCartOpen,
      openCart,
      closeCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
