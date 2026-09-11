'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Product, isPreorderProduct } from '../data/products';
import { useCart, CartItem } from '../context/CartContext';
import { apiCreateOrder, OrderItem, apiGetOffers, Offer } from '../utils/api';
import styles from './CheckoutModal.module.css';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  items?: CartItem[];
  quantity?: number;
  selectedColor?: string;
}

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const SHIPPING_OPTIONS = [
  {
    id: 'indian-post',
    name: 'Indian Post (Door-to-Door Delivery)',
    description: 'Ideal for home delivery to all locations, including remote areas across India.'
  },
  {
    id: 'speed-safe',
    name: 'Speed & Safe Courier Service',
    description: 'Available for fast and secure standard deliveries.'
  }
];

export default function CheckoutModal({ isOpen, onClose, product, items, quantity, selectedColor }: CheckoutModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [shippingPartner, setShippingPartner] = useState<string>('Indian Post (Door-to-Door Delivery)');
  const router = useRouter();
  const { clearCart } = useCart();

  useEffect(() => {
    setMounted(true);
    let isSubscribed = true;
    async function loadOffers() {
      try {
        const data = await apiGetOffers();
        if (isSubscribed && Array.isArray(data)) {
          setOffers(data);
        }
      } catch (e) {
        console.error('Failed to load offers in checkout:', e);
      }
    }
    loadOffers();
    return () => { isSubscribed = false; };
  }, []);

  const isPreorder = product ? isPreorderProduct(product) : false;
  const isCartCheckout = Boolean(items && items.length > 0);

  const effectiveProductPrice = product
    ? (isPreorder && product.preorderAmount && product.preorderAmount > 0
        ? product.preorderAmount
        : product.price)
    : 0;

  const checkoutItems: OrderItem[] = isCartCheckout
    ? items!.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: Math.max(1, i.quantity || 1),
        image: i.image,
        scale: i.scale,
        color: i.color
      }))
    : product
    ? [{
        id: product.id,
        name: product.name,
        price: effectiveProductPrice,
        quantity: Math.max(1, quantity || 1),
        image: product.image,
        scale: product.scale,
        color: selectedColor || undefined
      }]
    : [];

  const subtotal = checkoutItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalItemQuantity = checkoutItems.reduce((acc, item) => acc + item.quantity, 0);

  if (!isOpen || checkoutItems.length === 0 || !mounted) return null;

  // Evaluate qualifying offers
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
  const totalAmount = Math.max(0, subtotal - discountAmount);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const nameInput = form.querySelector('input[placeholder="Enter your full name"]') as HTMLInputElement;
    const phoneInput = form.querySelector('input[type="tel"]') as HTMLInputElement;
    const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
    const houseInput = form.querySelector('input[placeholder*="House number"]') as HTMLInputElement;
    const areaInput = form.querySelector('input[placeholder*="Road name"]') as HTMLInputElement;
    const landmarkInput = form.querySelector('input[placeholder*="Landmark"]') as HTMLInputElement;
    const pinInput = form.querySelector('input[placeholder*="PIN code"]') as HTMLInputElement;
    const cityInput = form.querySelector('input[placeholder="Enter your city"]') as HTMLInputElement;
    const stateSelect = form.querySelector('select') as HTMLSelectElement;

    const customerName = nameInput?.value?.trim() || '';
    const customerPhone = phoneInput?.value?.trim() || '';
    const customerEmail = emailInput?.value?.trim() || '';
    const pinCode = pinInput?.value?.trim() || '';
    const city = cityInput?.value?.trim() || '';
    const state = stateSelect?.value?.trim() || '';

    // Form validations
    if (!customerName || customerName.length < 2) {
      toast.error('Please enter your full name');
      nameInput?.focus();
      return;
    }

    const phoneDigits = customerPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      phoneInput?.focus();
      return;
    }

    if (!customerEmail || !customerEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      emailInput?.focus();
      return;
    }

    if (!houseInput?.value?.trim() || !areaInput?.value?.trim()) {
      toast.error('Please enter your full delivery address');
      houseInput?.focus();
      return;
    }

    if (!pinCode || pinCode.length < 6) {
      toast.error('Please enter a valid 6-digit PIN code');
      pinInput?.focus();
      return;
    }

    if (!city) {
      toast.error('Please enter your city');
      cityInput?.focus();
      return;
    }

    if (!state) {
      toast.error('Please select your state');
      stateSelect?.focus();
      return;
    }

    const addressStr = `${houseInput.value.trim()}, ${areaInput.value.trim()}${landmarkInput?.value?.trim() ? ' (Landmark: ' + landmarkInput.value.trim() + ')' : ''}`;

    setIsSubmitting(true);
    const toastId = toast.loading('Initializing secure payment...');

    try {
      // 1. Create Razorpay order on server
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: checkoutItems,
          amount: totalAmount,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
          notes: {
            customerName,
            customerPhone,
            customerEmail,
            itemsCount: checkoutItems.length,
          },
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to initialize payment gateway');
      }

      // 2. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Could not load Razorpay checkout. Please check your internet connection.');
      }

      toast.dismiss(toastId);

      // 3. Open Razorpay modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Diecast Hub',
        description: isPreorder ? 'Pre-Order Reservation Payment' : 'Diecast Model Order Payment',
        image: '/logo.png',
        order_id: orderData.orderId,
        handler: async function (response: any) {
          const placingToast = toast.loading('Payment received! Confirming your order...');
          try {
            await apiCreateOrder({
              customerName,
              customerEmail,
              customerPhone,
              address: addressStr,
              city,
              state,
              pinCode,
              shippingPartner,
              items: checkoutItems,
              clearCartAfterOrder: isCartCheckout,
              paymentMethod: 'Razorpay',
              paymentStatus: 'Paid',
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (isCartCheckout) {
              await clearCart();
            }

            try {
              localStorage.setItem('diecasthub_last_order', Date.now().toString());
              window.dispatchEvent(new Event('diecasthub_new_order_placed'));
            } catch (_) {}

            toast.success(
              isPreorder
                ? 'Payment successful! Pre-order reservation confirmed.'
                : 'Payment successful! Order placed.',
              { id: placingToast }
            );
            onClose();
            router.push('/orders');
          } catch (orderErr: unknown) {
            const message = orderErr instanceof Error ? orderErr.message : 'Order recording failed';
            toast.error(message, { id: placingToast });
          } finally {
            setIsSubmitting(false);
          }
        },
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        notes: {
          address: addressStr,
        },
        theme: {
          color: '#12618F',
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
            toast('Payment cancelled', { icon: 'ℹ️' });
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setIsSubmitting(false);
        toast.error(`Payment failed: ${resp.error?.description || 'Transaction declined'}`);
      });
      rzp.open();
    } catch (err: unknown) {
      toast.dismiss(toastId);
      const message = err instanceof Error ? err.message : 'Payment error';
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isPreorder ? 'Pre-Order Reservation' : `Checkout (${totalItemQuantity} ${totalItemQuantity === 1 ? 'Item' : 'Items'})`}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.content}>
            {/* Products Summary */}
            <div style={{ marginBottom: '16px', borderBottom: '1px solid #eaeaea', paddingBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#444', marginBottom: '12px' }}>
                Order Summary ({totalItemQuantity} {totalItemQuantity === 1 ? 'item' : 'items'})
              </div>

              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {checkoutItems.map((item) => (
                  <div key={item.id} className={styles.productSummary} style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
                    <img src={item.image} alt={item.name} className={styles.productImage} />
                    <div className={styles.productInfo}>
                      <h3 className={styles.productName}>{item.name}</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ fontSize: '13px', color: '#666' }}>
                          Qty: {item.quantity} {item.scale ? `• Scale: ${item.scale}` : ''} {item.color ? `• Color: ${item.color}` : ''}
                        </span>
                        <span className={styles.productPrice}>
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {discountAmount > 0 && (
                <div style={{ marginTop: '12px', padding: '8px 12px', backgroundColor: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0', color: '#065f46', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🎉</span>
                  <span>{bestOffer?.discountPercentage}% discount applied on purchases ₹{bestOffer?.minPurchaseAmount.toLocaleString('en-IN')}+ (You save ₹{discountAmount.toLocaleString('en-IN')})</span>
                </div>
              )}

              {discountAmount > 0 ? (
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #ddd', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#64748b' }}>
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#16a34a', fontWeight: 600 }}>
                    <span>Special Offer ({bestOffer?.discountPercentage}%)</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '16px', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                    <span>Total Amount</span>
                    <span style={{ color: 'var(--color-primary-light-blue, #0284c7)' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed #ddd', fontWeight: 700, fontSize: '16px' }}>
                  <span>Total Amount</span>
                  <span style={{ color: 'var(--color-primary-light-blue, #0284c7)' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            {/* Shipping Form */}
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name *</label>
                <input required type="text" className={styles.input} placeholder="Enter your full name" />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Mobile Number *</label>
                  <input required type="tel" className={styles.input} placeholder="10-digit mobile number" pattern="[0-9]{10}" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email Address *</label>
                  <input required type="email" className={styles.input} placeholder="Enter your email" />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>House No. / Building Name *</label>
                <input required type="text" className={styles.input} placeholder="House number, building name, apartment" />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Road Name / Area / Colony *</label>
                <input required type="text" className={styles.input} placeholder="Road name, area, colony" />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Landmark (Optional)</label>
                <input type="text" className={styles.input} placeholder="E.g. Near Apollo Hospital" />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>PIN Code *</label>
                  <input required type="text" className={styles.input} placeholder="6-digit PIN code" pattern="[0-9]{6}" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>City *</label>
                  <input required type="text" className={styles.input} placeholder="Enter your city" />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>State *</label>
                <select required className={styles.select} defaultValue="">
                  <option value="" disabled>Select your state</option>
                  {STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              {/* Shipping Options & Delivery Partners */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Shipping Options &amp; Delivery Partners *</label>
                <div className={styles.shippingOptionsContainer}>
                  {SHIPPING_OPTIONS.map((option) => {
                    const isSelected = shippingPartner === option.name;
                    return (
                      <label 
                        key={option.id} 
                        className={`${styles.shippingOptionCard} ${isSelected ? styles.shippingOptionCardActive : ''}`}
                      >
                        <input 
                          type="radio" 
                          name="shippingPartner" 
                          value={option.name} 
                          checked={isSelected} 
                          onChange={() => setShippingPartner(option.name)}
                          className={styles.shippingOptionRadio}
                        />
                        <div className={styles.shippingOptionContent}>
                          <div className={styles.shippingOptionTitle}>
                            <span>{option.name}</span>
                          </div>
                          <p className={styles.shippingOptionDesc}>{option.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Delivery Instructions (Optional)</label>
                <textarea className={styles.textarea} placeholder="Any special instructions for delivery?"></textarea>
              </div>

              {/* Payment Method Notice */}
              <div style={{
                marginTop: '16px',
                padding: '12px 16px',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <div style={{
                  fontSize: '24px',
                  lineHeight: 1,
                }}>💳</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0369a1' }}>
                    Payment via Razorpay Secure Gateway
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Supports UPI (GPay, PhonePe, Paytm), Cards, NetBanking, and Wallets.
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.footer}>
            <button type="button" className={styles.cancelButton} onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.submitButton} 
              disabled={isSubmitting}
              style={{
                background: 'linear-gradient(135deg, #12618F 0%, #0369a1 100%)',
                boxShadow: '0 4px 14px rgba(18, 97, 143, 0.3)',
              }}
            >
              {isSubmitting
                ? 'Connecting to Razorpay...'
                : `Pay ₹${totalAmount.toLocaleString('en-IN')} with Razorpay`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

