'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface CartItem {
  id: string;
  name: string;
  scale: string;
  price: number;
  quantity: number;
  image: string;
  color?: string;
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
    // Optimistic UI update
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i);
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
      if (data.success && Array.isArray(data.items)) {
        setCartItems(data.items);
      }
    } catch (e) {
      console.error('[Cart] Failed to persist add to database:', e);
    }
  }, []);

  const removeFromCart = useCallback(async (id: string) => {
    setCartItems(prev => prev.filter(i => i.id !== id));

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

    setCartItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));

    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, quantity }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setCartItems(data.items);
      }
    } catch (e) {
      console.error('[Cart] Failed to update item quantity in database:', e);
    }
  }, [removeFromCart]);

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
