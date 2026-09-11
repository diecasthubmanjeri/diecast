'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { apiGetUserOrders, Order } from '../../utils/api';
import styles from './page.module.css';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;
    async function loadOrders() {
      try {
        const data = await apiGetUserOrders();
        if (isSubscribed) {
          setOrders(data);
        }
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        if (isSubscribed) {
          setLoading(false);
          setMounted(true);
        }
      }
    }
    loadOrders();
    return () => { isSubscribed = false; };
  }, []);

  if (!mounted || loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>My Orders</h1>
        <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>Loading your orders...</div>
      </div>
    );
  }

  const getStatusClass = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return styles.statusPending;
      case 'Shipped': return styles.statusShipped;
      case 'Delivered': return styles.statusDelivered;
      case 'Cancelled': return styles.statusCancelled;
      default: return styles.statusPending;
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Orders</h1>
      
      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>You haven't placed any orders yet.</h2>
          <p>Browse our catalog to find your next diecast model!</p>
          <Link href="/catalog" className={styles.shopButton}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {orders.map(order => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div className={styles.orderInfo}>
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Order Placed</span>
                    <span className={styles.infoValue}>
                      {new Date(order.date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Total</span>
                    <span className={styles.infoValue}>₹{order.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Payment</span>
                    <span className={styles.infoValue} style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>
                      ✓ Paid ({order.paymentMethod || 'Razorpay'})
                    </span>
                  </div>
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Order ID</span>
                    <span className={styles.infoValue}>#{order.id}</span>
                  </div>
                  {order.shippingPartner && (
                    <div className={styles.infoBlock}>
                      <span className={styles.infoLabel}>Shipping Partner</span>
                      <span className={styles.infoValue} style={{ fontSize: '13px', color: '#0284c7' }}>{order.shippingPartner}</span>
                    </div>
                  )}
                  {order.trackingId && (
                    <div className={styles.infoBlock}>
                      <span className={styles.infoLabel}>Tracking ID</span>
                      <span className={styles.infoValue} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '13px', backgroundColor: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>{order.trackingId}</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(order.trackingId!);
                            toast.success('Tracking ID copied!');
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '2px' }}
                          title="Copy to clipboard"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                      </span>
                    </div>
                  )}
                </div>
                <div className={`${styles.orderStatus} ${getStatusClass(order.status)}`}>
                  {order.status}
                </div>
              </div>
              
              <div className={styles.orderBody} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px' }}>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'center', borderBottom: idx < order.items!.length - 1 ? '1px solid #f0f0f0' : 'none', paddingBottom: idx < order.items!.length - 1 ? '12px' : '0' }}>
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className={styles.productImage} 
                      />
                      <div className={styles.productDetails}>
                        <h3 className={styles.productName}>{item.name}</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: '#666' }}>
                            Qty: {item.quantity} {item.scale ? `• Scale: ${item.scale}` : ''} {item.color ? `• Color: ${item.color}` : ''}
                          </span>
                          <span className={styles.productPrice}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : order.product ? (
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <img 
                      src={order.product.image} 
                      alt={order.product.name} 
                      className={styles.productImage} 
                    />
                    <div className={styles.productDetails}>
                      <h3 className={styles.productName}>{order.product.name}</h3>
                      <p className={styles.productPrice}>₹{order.product.price.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ) : null}
              </div>
              
              <div className={styles.orderFooter}>
                <button 
                  className={styles.trackButton}
                  onClick={() => {
                    if (order.status === 'Delivered') {
                      toast.success('Thanks for your order! Review feature coming soon.');
                    } else if (order.trackingId) {
                      navigator.clipboard.writeText(order.trackingId);
                      toast.success('Tracking ID copied! Please paste it on your courier service portal.', { duration: 4000 });
                      alert(`Copy your tracking ID (${order.trackingId}) and paste it on your selected courier service tracking page.`);
                    } else {
                      alert('Your tracking ID will be updated here soon once the package is dispatched.');
                    }
                  }}
                >
                  {order.status === 'Delivered' ? 'Leave a Review' : 'Track Package'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
