'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '../context/CartContext';
import styles from './Header.module.css';
import CartDrawer from './CartDrawer';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { cartItems, openCart } = useCart();
  const cartItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync URL to state only when the user is NOT actively typing
  useEffect(() => {
    if (!isFocused) {
      const q = searchParams.get('q') || '';
      if (q !== searchQuery) {
        setSearchQuery(q);
      }
    }
  }, [searchParams, isFocused]);

  // Debounce the router push to avoid input lag and missed keystrokes
  useEffect(() => {
    const handler = setTimeout(() => {
      const currentQ = searchParams.get('q') || '';
      if (searchQuery !== currentQ) {
        if (searchQuery.trim()) {
          router.push(`/catalog?q=${encodeURIComponent(searchQuery)}`, { scroll: false });
        } else if (currentQ !== '') {
          router.push('/catalog', { scroll: false });
        }
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery, router, searchParams]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <header className={styles.header}>
      <div className={styles.navContainer}>
        {/* Mobile Left Section */}
        <div className={styles.mobileLeftGroup}>
          <button 
            className={styles.hamburger} 
            aria-label="Menu"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={isMobileMenuOpen ? "M18 6L6 18M6 6l12 12" : "M3 12h18M3 6h18M3 18h18"} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className={styles.navMain}>
          <Link href="/" className={styles.logo}>
            <Image src="/logo.png" alt="Diecast Hub Logo" width={200} height={66} style={{ width: '120px', height: 'auto' }} priority />
          </Link>
          
          <nav className={styles.desktopNav}>
            <Link href="/">Home</Link>
            <Link href="/catalog">Catalog</Link>
            <Link href="/orders">My Orders</Link>
            <Link href="#footer">Contact</Link>
          </nav>
        </div>

        <div className={styles.navIcons}>
          <div className={`${styles.desktopSearchWrapper} ${isSearchOpen ? styles.open : ''}`}>
            <input 
              type="text" 
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search products..."
              className={styles.desktopSearchInput}
              autoFocus
            />
            <button aria-label="Close Search" className={styles.iconBtn} onClick={() => setIsSearchOpen(false)} style={{ marginLeft: '8px' }}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <line x1="18" y1="6" x2="6" y2="18"></line>
                 <line x1="6" y1="6" x2="18" y2="18"></line>
               </svg>
            </button>
          </div>
          
          <button 
            aria-label="Search" 
            className={`${styles.iconBtn} ${styles.desktopSearchBtn} ${isSearchOpen ? styles.hidden : ''}`} 
            onClick={() => setIsSearchOpen(true)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button aria-label="Cart" className={styles.iconBtn} onClick={openCart} style={{ position: 'relative' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
            </svg>
            {mounted && cartItemsCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-8px',
                background: '#e53935',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '2px 6px',
                borderRadius: '10px'
              }}>
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <nav className={styles.mobileNavLinks}>
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
            <Link href="/catalog" onClick={() => setIsMobileMenuOpen(false)}>Catalog</Link>
            <Link href="/orders" onClick={() => setIsMobileMenuOpen(false)}>My Orders</Link>
            <Link href="#footer" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
          </nav>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer />
    </header>
  );
}
