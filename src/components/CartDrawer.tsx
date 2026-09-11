'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { apiGetOffers, Offer } from '../utils/api';
import CheckoutModal from './CheckoutModal';
import styles from './CartDrawer.module.css';

interface CartDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function CartDrawer({ isOpen: propsIsOpen, onClose: propsOnClose }: CartDrawerProps) {
  const { cartItems, removeFromCart, updateQuantity, isCartOpen: contextIsOpen, closeCart: contextClose } = useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let isSubscribed = true;
    async function loadOffers() {
      try {
        const data = await apiGetOffers();
        if (isSubscribed && Array.isArray(data)) {
          setOffers(data);
        }
      } catch (err) {
        console.error('Failed to load offers in cart:', err);
      }
    }
    loadOffers();
    return () => { isSubscribed = false; };
  }, []);

  const isOpen = propsIsOpen !== undefined ? propsIsOpen : contextIsOpen;
  const handleClose = propsOnClose || contextClose;

  // Prevent scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleRemoveItem = (id: string) => {
    removeFromCart(id);
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity > 0) {
      updateQuantity(id, newQuantity);
    }
  };

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) return;
    handleClose();
    setIsCheckoutOpen(true);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Dynamic Offer Evaluation
  const qualifyingOffers = offers
    .filter((o) => o.isActive && subtotal >= o.minPurchaseAmount)
    .sort((a, b) => {
      const discA = (subtotal * a.discountPercentage) / 100;
      const discB = (subtotal * b.discountPercentage) / 100;
      return discB - discA;
    });

  const bestOffer = qualifyingOffers[0] || null;
  const discountAmount = bestOffer
    ? Math.round((subtotal * bestOffer.discountPercentage) / 100)
    : 0;
  const total = Math.max(0, subtotal - discountAmount);

  // Next upcoming offer prompt
  const upcomingOffers = offers
    .filter((o) => o.isActive && o.minPurchaseAmount > subtotal)
    .sort((a, b) => a.minPurchaseAmount - b.minPurchaseAmount);
  const nextOffer = upcomingOffers[0] || null;
  const amountToNextOffer = nextOffer ? nextOffer.minPurchaseAmount - subtotal : 0;

  if (!mounted) return null;

  return (
    <>
      <div 
        className={`${styles.overlay} ${isOpen ? styles.open : ''}`} 
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className={`${styles.drawer} ${isOpen ? styles.open : ''}`} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <h2>Your Cart ({mounted ? cartItems.reduce((acc, i) => acc + i.quantity, 0) : 0})</h2>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close cart">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.itemsContainer}>
          {!mounted || cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '40px', color: '#777' }}>
              Your cart is empty
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className={styles.cartItem}>
                <div>
                   <img src={item.image} alt={item.name} className={styles.itemImage} />
                </div>
                <div className={styles.itemDetails}>
                  <div className={styles.itemHeader}>
                    <div>
                      <h3 className={styles.itemName}>{item.name}</h3>
                      <p className={styles.itemScale}>
                        Scale: {item.scale}{item.color ? ` • Color: ${item.color}` : ''}
                      </p>
                    </div>
                    <button 
                      className={styles.deleteBtn} 
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label="Remove item"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                  <div className={styles.itemPriceRow}>
                    <div className={styles.quantityControl}>
                      <button className={styles.qtyBtn} onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button className={styles.qtyBtn} onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <span className={styles.itemPrice}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.footer}>
          {/* Active Offer Prompt or Savings Banner */}
          {discountAmount > 0 && bestOffer ? (
            <div style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '8px',
              padding: '10px 12px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#065f46',
              fontSize: '12px',
              fontWeight: 600
            }}>
              <span style={{ fontSize: '16px' }}>🎉</span>
              <span>
                {bestOffer.discountPercentage}% discount applied! You save ₹{discountAmount.toLocaleString('en-IN')} on this order.
              </span>
            </div>
          ) : nextOffer && amountToNextOffer > 0 ? (
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px dashed #bfdbfe',
              borderRadius: '8px',
              padding: '8px 12px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#1e40af',
              fontSize: '12px',
            }}>
              <span>🏷️</span>
              <span>
                Add <strong>₹{amountToNextOffer.toLocaleString('en-IN')}</strong> more to unlock <strong>{nextOffer.discountPercentage}% OFF</strong>!
              </span>
            </div>
          ) : null}

          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>

          {discountAmount > 0 && (
            <div className={styles.summaryRow} style={{ color: '#16a34a', fontWeight: 600 }}>
              <span>Special Offer ({bestOffer?.discountPercentage}%)</span>
              <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className={styles.totalRow}>
            <span>Total</span>
            <span style={{ color: discountAmount > 0 ? '#16a34a' : undefined }}>
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
          <button 
            className={styles.checkoutBtn}
            onClick={handleProceedToCheckout}
            disabled={cartItems.length === 0}
            style={cartItems.length === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>

      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        items={cartItems} 
      />
    </>
  );
}

