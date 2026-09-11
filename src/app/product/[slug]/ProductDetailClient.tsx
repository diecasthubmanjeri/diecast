'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Product, isPreorderProduct } from '../../../data/products';
import { useCart } from '../../../context/CartContext';
import styles from './page.module.css';
import CheckoutModal from '../../../components/CheckoutModal';

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [mounted, setMounted] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mobileImageIndex, setMobileImageIndex] = useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    return product.colors && product.colors.length > 0 ? product.colors[0] : '';
  });
  const { addToCart, cartItems } = useCart();

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const isPreorder = isPreorderProduct(product);

  const availableColors = Array.from(
    new Set([
      ...(product.colors || []),
      ...(product.colorImages?.map((ci) => ci.color) || []),
    ])
  ).filter(Boolean);

  let allImages = [product.image, ...(product.gallery || [])].filter(Boolean);

  if (selectedColor && product.colorImages && product.colorImages.length > 0) {
    const colorImagesForSelected = product.colorImages.filter(
      (ci) => ci.color.toLowerCase() === selectedColor.toLowerCase() && ci.images && ci.images.length > 0
    );
    if (colorImagesForSelected.length > 0) {
      allImages = colorImagesForSelected.flatMap((ci) => ci.images);
    }
  }

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => setIsLightboxOpen(false);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleAddToCart = () => {
    const effectivePrice =
      isPreorder && product.preorderAmount && product.preorderAmount > 0
        ? product.preorderAmount
        : product.price;

    addToCart({
      id: product.id,
      name: product.name,
      scale: product.scale,
      price: effectivePrice,
      quantity: quantity,
      image: product.image,
      color: selectedColor || undefined,
    });
    toast.success(isPreorder ? 'Added pre-order to cart!' : 'Added to cart!');
  };

  const hasThisProductInCart = cartItems.some((i) => i.id === product.id);
  const checkoutItemsFromCart = hasThisProductInCart
    ? cartItems.map((i) =>
        i.id === product.id
          ? {
              ...i,
              quantity: Math.max(i.quantity, quantity),
              color: selectedColor || i.color,
            }
          : i
      )
    : undefined;

  return (
    <div className={styles.container}>
      <div className={styles.productMain}>
        {/* Gallery */}
        <div className={styles.gallery}>
          <div className={styles.imageGridDesktop}>
            {allImages.map((img, i) => (
              <div
                key={i}
                className={styles.imageWrapper}
                onClick={() => openLightbox(i)}
              >
                <img
                  src={img}
                  alt={`${product.name} angle ${i + 1}`}
                  className={styles.productImg}
                />
              </div>
            ))}
          </div>

          <div className={styles.imageCarouselMobile}>
            <div
              className={styles.carouselTrack}
              onScroll={(e) => {
                const scrollLeft = e.currentTarget.scrollLeft;
                const width = e.currentTarget.clientWidth;
                setMobileImageIndex(Math.round(scrollLeft / width));
              }}
            >
              {allImages.map((img, i) => (
                <div key={i} className={styles.carouselSlide} onClick={() => openLightbox(i)}>
                  <img src={img} alt={`${product.name} ${i}`} className={styles.productImg} />
                </div>
              ))}
            </div>
            <div className={styles.carouselDots}>
              {allImages.map((_, i) => (
                <div
                  key={i}
                  className={`${styles.dot} ${i === mobileImageIndex ? styles.activeDot : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className={styles.detailsContainer}>
          <div className={styles.details}>
            {isPreorder && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#ffedd5',
                  color: '#c2410c',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontWeight: 700,
                  fontSize: '12px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  marginBottom: '14px',
                  boxShadow: '0 2px 4px rgba(194, 65, 12, 0.1)',
                }}
              >
                <span>⚡</span>
                <span>COMING SOON • PRE-ORDER</span>
                {product.releaseDate && (
                  <span style={{ marginLeft: '4px', borderLeft: '1px solid #fdba74', paddingLeft: '8px' }}>
                    {product.releaseDate}
                  </span>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <h1 className={styles.title} style={{ margin: 0 }}>
                {product.name}
              </h1>
              <button
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.share) {
                    navigator
                      .share({
                        title: product.name,
                        url: window.location.href,
                      })
                      .catch(console.error);
                  } else if (typeof navigator !== 'undefined') {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied to clipboard!');
                  }
                }}
                style={{
                  background: 'none',
                  border: '1px solid #eee',
                  cursor: 'pointer',
                  color: '#555',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s',
                  flexShrink: 0,
                }}
                title="Share Product"
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8f8f8')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </button>
            </div>

            <div className={styles.priceRow}>
              <span className={styles.price}>Rs. {product.price.toLocaleString('en-IN')}</span>
              {product.originalPrice && (
                <span className={styles.originalPrice}>Rs. {product.originalPrice.toLocaleString('en-IN')}</span>
              )}
            </div>

            <hr className={styles.divider} />

            {availableColors.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', color: '#444' }}>
                  Available Colors:
                </h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {availableColors.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setSelectedColor(c);
                        setCurrentImageIndex(0);
                        setMobileImageIndex(0);
                      }}
                      style={{
                        padding: '6px 12px',
                        border: selectedColor === c ? '2px solid #0284c7' : '1px solid #ddd',
                        backgroundColor: selectedColor === c ? '#e0f2fe' : '#fff',
                        color: selectedColor === c ? '#0369a1' : '#333',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(() => {
              const isOutOfStock = !isPreorder && product.stock === 0;
              const maxStock = isPreorder ? 10 : product.stock > 0 ? product.stock : 10;

              return (
                <div className={styles.actions}>
                  <div className={styles.qtyRow}>
                    <div className={styles.qtySelector}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={isOutOfStock}
                      >
                        -
                      </button>
                      <input type="text" className={styles.qtyInput} value={quantity} readOnly />
                      <button
                        className={styles.qtyBtn}
                        onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                        disabled={isOutOfStock || quantity >= maxStock}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className={styles.addToCart}
                      disabled={isOutOfStock}
                      onClick={handleAddToCart}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ marginRight: '8px' }}
                      >
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                      </svg>
                      {isOutOfStock ? 'Out of Stock' : isPreorder ? 'Pre-Order' : 'Add to cart'}
                    </button>
                  </div>

                  <button
                    className={styles.buyNow}
                    style={
                      isPreorder
                        ? { background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', borderColor: '#c2410c' }
                        : {}
                    }
                    disabled={isOutOfStock}
                    onClick={() => setIsCheckoutOpen(true)}
                  >
                    {isOutOfStock ? 'Out of Stock' : isPreorder ? 'Pre-Order Now' : 'Buy it now'}
                  </button>
                </div>
              );
            })()}

            <div className={styles.specifications}>
              <h2 className={styles.sectionTitle}>Features:</h2>
              <ul className={styles.specList}>
                <li>
                  <strong>Brand:</strong> {product.brand}
                </li>
                <li>
                  <strong>Model:</strong> {product.model}
                </li>
                <li>
                  <strong>Scale:</strong> {product.scale}
                </li>
                <li>
                  <strong>Category:</strong> {product.category}
                </li>
                {availableColors.length > 0 && (
                  <li>
                    <strong>Color:</strong> {availableColors.join(', ')}
                  </li>
                )}
                <li>
                  <strong>Material:</strong> Diecast Metal with Plastic Parts
                </li>
              </ul>
            </div>

            <div className={styles.description}>
              <h2 className={styles.sectionTitle}>Product Description</h2>
              <p>
                Experience exceptional craftsmanship with this <strong>{product.scale} scale die-cast car model</strong>,
                meticulously designed with realistic details and a smooth finish. Featuring a finely detailed exterior,
                high-quality paintwork, and authentic styling, this model is an excellent addition to any die-cast collection.
              </p>
              <p>
                Crafted from <strong>high-quality metal and plastic components</strong>, it is built for durability and long-lasting display.
                The <strong>free-rolling wheels</strong> and <strong>durable rubber tires</strong> enhance its realistic appearance, making it ideal for collectors and automotive enthusiasts.
              </p>
              <p>
                Perfect for <strong>collectors, display shelves, office desks, home decor, gifts, and retail displays</strong>,
                this {product.scale} scale model offers an eye-catching display piece for any space.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Overlay */}
      {isLightboxOpen && (
        <div className={styles.lightboxOverlay} onClick={closeLightbox}>
          <button className={styles.lightboxClose} onClick={closeLightbox}>
            ×
          </button>

          <button className={styles.lightboxPrev} onClick={prevImage}>
            ❮
          </button>

          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <img
              src={allImages[currentImageIndex]}
              alt={`${product.name} full screen`}
              className={styles.lightboxImage}
            />
          </div>

          <button className={styles.lightboxNext} onClick={nextImage}>
            ❯
          </button>

          <div className={styles.lightboxCounter}>
            {currentImageIndex + 1} / {allImages.length}
          </div>
        </div>
      )}

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        product={product}
        quantity={quantity}
        items={checkoutItemsFromCart}
        selectedColor={selectedColor}
      />
    </div>
  );
}
