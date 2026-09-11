'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Product, isPreorderProduct } from '../data/products';
import { useCart } from '../context/CartContext';
import styles from './ProductCard.module.css';
import CheckoutModal from './CheckoutModal';

interface ProductCardProps {
  product: Product;
  hideActions?: boolean;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&auto=format&fit=crop&q=80';

export default function ProductCard({ product, hideActions }: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(product.image);
  const isPreorder = isPreorderProduct(product);

  useEffect(() => {
    setImageSrc(product.image);
  }, [product.image]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.colors && product.colors.length > 0) {
      toast('Please select your preferred color on the product page', { icon: '🎨' });
      router.push(`/product/${product.slug}`);
      return;
    }
    const effectivePrice = isPreorder && product.preorderAmount && product.preorderAmount > 0
      ? product.preorderAmount
      : product.price;

    addToCart({
      id: product.id,
      name: product.name,
      scale: product.scale,
      price: effectivePrice,
      quantity: 1,
      image: product.image
    });
    toast.success(isPreorder ? 'Added pre-order to cart!' : 'Added to cart!');
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Navigate directly to product details so user can select color & examine specifications
    router.push(`/product/${product.slug}`);
  };

  return (
    <div className={styles.card}>
      <Link href={`/product/${product.slug}`} className={styles.imageWrapper}>
        {isPreorder ? (
          <span className={styles.badgeComingSoon}>{product.badgeTag || 'COMING SOON'}</span>
        ) : (
          <>
            {product.isNew && <span className={styles.badgeNew}>NEW</span>}
            {product.isBestseller && <span className={styles.badgeBestseller}>BESTSELLER</span>}
          </>
        )}
        
        <div className={styles.imageContainer}>
          <img 
            src={imageSrc || FALLBACK_IMAGE} 
            alt={product.name} 
            className={styles.productImg}
            loading="lazy"
            decoding="async"
            onError={() => setImageSrc(FALLBACK_IMAGE)}
          />
        </div>
      </Link>
      
      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={styles.brand}>{product.brand}</span>
          <span className={styles.scale}>{product.scale}</span>
        </div>
        
        <Link href={`/product/${product.slug}`} className={styles.title}>
          {product.name}
        </Link>
        
        {product.releaseDate && (
          <span className={styles.releaseDatePill}>
            🗓️ {product.releaseDate}
          </span>
        )}
        
        <div className={styles.priceRow}>
          <div className={styles.priceContainer}>
            {isPreorder && product.preorderAmount ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className={styles.price}>₹{product.preorderAmount.toLocaleString('en-IN')} <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#666' }}>(Preorder Amount)</span></span>
                <span style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>Full Price: ₹{product.price.toLocaleString('en-IN')}</span>
              </div>
            ) : (
              <span className={styles.price}>₹{product.price.toLocaleString('en-IN')}</span>
            )}
            {product.originalPrice && (
              <span className={styles.originalPrice}>₹{product.originalPrice.toLocaleString('en-IN')}</span>
            )}
          </div>
        </div>
        {!hideActions && (
          <div className={styles.actionRow}>
            <button 
              className={styles.addToCart} 
              aria-label={isPreorder ? 'Pre-Order' : 'Add to Cart'}
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <span className={styles.addToCartText}>
                {product.stock === 0 ? (isPreorder ? 'Sold Out' : 'Out of Stock') : (isPreorder ? 'Pre-Order' : 'Add to Cart')}
              </span>
              <span className={styles.addToCartIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/><path d="M12 5v14"/>
                </svg>
              </span>
            </button>
            <button 
              className={isPreorder ? styles.btnPreorder : styles.btnBuyNow} 
              onClick={handleBuyNow}
              disabled={product.stock === 0}
            >
              {product.stock === 0 ? (isPreorder ? 'Sold Out' : 'Out of Stock') : (isPreorder ? 'Pre-Order' : 'Buy Now')}
            </button>
          </div>
        )}
      </div>

      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        product={product} 
      />
    </div>
  );
}
