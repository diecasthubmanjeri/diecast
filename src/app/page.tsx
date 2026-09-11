'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '../components/ProductCard';
import TransparentCategoryImg from '../components/TransparentCategoryImg';

import HeroBanner from '../components/HeroBanner';
import CustomHero from '../components/CustomHero';
import ProductSkeleton from '../components/ProductSkeleton';
import { Product, collections, Brand, isPreorderProduct, Category, defaultBrands, defaultCategories, defaultScales } from '../data/products';
import { apiGetProducts, apiGetBrands, apiGetCategories, apiGetScales } from '../utils/api';
import styles from './page.module.css';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [localBrands, setLocalBrands] = useState<Brand[]>(defaultBrands);
  const [localCategories, setLocalCategories] = useState<Category[]>(defaultCategories);
  const [localScales, setLocalScales] = useState<string[]>(defaultScales);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;

    async function loadData() {
      try {
        const [prods, brs, cats, scs] = await Promise.all([
          apiGetProducts(),
          apiGetBrands(),
          apiGetCategories(),
          apiGetScales(),
        ]);

        if (isSubscribed) {
          if (prods && prods.length > 0) setProducts(prods);
          if (brs && brs.length > 0) setLocalBrands(brs);
          if (cats && cats.length > 0) setLocalCategories(cats);
          if (scs && scs.length > 0) setLocalScales(scs);
        }
      } catch (err) {
        console.error('Failed to load home page data', err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }

    loadData();

    const handleUpdated = () => {
      loadData();
    };
    window.addEventListener('diecasthub_products_updated', handleUpdated);

    return () => {
      isSubscribed = false;
      window.removeEventListener('diecasthub_products_updated', handleUpdated);
    };
  }, []);

  const preorderProducts = products.filter(isPreorderProduct);
  const regularProducts = products.filter(p => !isPreorderProduct(p));
  const featuredProducts = regularProducts.length > 0 ? regularProducts : products;
  const newArrivalsProducts = regularProducts.length > 0 ? regularProducts : products;

  // Dynamically include any scales and brands present in products
  const productScales = products.map(p => p.scale).filter(Boolean);
  const allScales = Array.from(new Set([...localScales, ...productScales]));

  const brandMap = new Map<string, Brand>();
  localBrands.forEach(b => brandMap.set(b.name.toLowerCase(), b));
  products.forEach(p => {
    if (p.brand && !brandMap.has(p.brand.toLowerCase())) {
      brandMap.set(p.brand.toLowerCase(), { name: p.brand, logo: '' });
    }
  });
  const allBrands = Array.from(brandMap.values());

  return (
    <div className={styles.main}>
     
      <CustomHero />
       {localCategories && localCategories.length > 0 && (
        <div id="categories" className={styles.categoriesContainer}>
          <section className={`${styles.section} ${styles.categoriesSection}`}>
            <div className={styles.categoriesHeader}>
              <h2 className={styles.categoriesTitle}>CATEGORIES</h2>
              <Link href="/catalog" className={styles.categoriesShopAll}>
                &rarr; SHOP ALL
              </Link>
            </div>
            <div className={styles.categoryGrid}>
              {localCategories.map(category => (
                <Link key={category.name} href={`/catalog?category=${encodeURIComponent(category.name)}`} className={styles.categoryCard}>
                  <div className={styles.categoryImageWrapper}>
                    <TransparentCategoryImg 
                      src={category.image} 
                      alt={category.name} 
                      className={styles.categoryImage}
                    />
                  </div>
                  <span className={styles.categoryNameText}>{category.name}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 1. Shop by Scale */}
      <section id="scales" className={`${styles.section} ${styles.scaleSection}`}>
        <h2 className={styles.sectionTitleCenter} style={{ textAlign: 'center' }}>Shop by Scale</h2>
        <div className={styles.scaleGrid}>
          {allScales.map((scale, index) => {
            const scaleColors = ['#1B84D2', '#1B65A6', '#1A43A2', '#0C2652', '#0A1846', '#050c24'];
            const color = scaleColors[index % scaleColors.length];
            return (
              <Link key={scale} href={`/catalog?scale=${scale.replaceAll(':', '-')}`} className={styles.scaleCard}>
                <span className={styles.scaleName} style={{ color: color }}>{scale}</span>
                <span className={styles.scaleLabel}>Scale</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 2. Shop by Brand */}
      <section id="brands" className={styles.section}>
        <h2 className={styles.sectionTitleCenter}>Shop By Brand</h2>
        <div className={styles.brandGrid}>
          {allBrands.map(brand => (
            <Link key={brand.name} href={`/catalog?brand=${brand.name.toLowerCase().replaceAll(' ', '-')}`} className={styles.brandCard}>
              <div className={styles.brandImagePlaceholder}>
                {brand.logo ? (
                  <img 
                    src={brand.logo} 
                    alt={brand.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} 
                  />
                ) : (
                  <img 
                    src={`https://placehold.co/140x140/f0f0f0/000?text=${encodeURIComponent(brand.name)}`} 
                    alt={brand.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} 
                  />
                )}
              </div>
              <span className={styles.brandName}>{brand.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Diecast */}
      <section id="featured" className={`${styles.section} ${styles.productSection}`}>
        <div className={styles.sectionHeaderGroup}>
          <span className={`${styles.sectionBadge} ${styles.sectionBadgeFeatured}`}>Handpicked Selection</span>
          <h2 className={styles.sectionMainTitle}>FEATURED DIECAST</h2>
          <p className={styles.sectionSubtitleCenter}>Curated premium models chosen for their authentic detail and craftsmanship</p>
        </div>
        <div className={styles.productGrid}>
          {loading && products.length === 0 ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <ProductSkeleton key={`feat-skel-${idx}`} />
            ))
          ) : (
            featuredProducts.slice(0, 4).map((product, idx) => (
              <ProductCard key={`feat-${product.id || product.slug || idx}`} product={product} hideActions />
            ))
          )}
        </div>
      </section>

      {/* 4. Pre-Orders (Upcoming products with Coming Soon tag) */}
      {preorderProducts.length > 0 && (
        <section id="preorders" className={`${styles.section} ${styles.preorderSection}`}>
          <div className={styles.sectionHeaderGroup}>
            <span className={`${styles.sectionBadge} ${styles.sectionBadgePreorder}`}>
              <span className={styles.preorderTagDot}></span>
              Upcoming Drops
            </span>
            <h2 className={styles.sectionMainTitle}>PRE-ORDERS</h2>
            <p className={styles.sectionSubtitleCenter}>Reserve highly anticipated limited releases before they officially land</p>
          </div>
          <div className={styles.productGrid}>
            {preorderProducts.map((product, idx) => (
              <ProductCard key={`preorder-${product.id || product.slug || idx}`} product={product} hideActions />
            ))}
          </div>
        </section>
      )}

      {/* 5. New Arrivals */}
      <section id="new-arrivals" className={`${styles.section} ${styles.productSection}`}>
        <div className={styles.sectionHeaderGroup}>
          <span className={`${styles.sectionBadge} ${styles.sectionBadgeNew}`}>Fresh in Stock</span>
          <h2 className={styles.sectionMainTitle}>NEW ARRIVALS</h2>
          <p className={styles.sectionSubtitleCenter}>Discover the latest additions ready to elevate your collection today</p>
        </div>

        <div className={styles.productGrid}>
          {loading && products.length === 0 ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <ProductSkeleton key={`new-skel-${idx}`} />
            ))
          ) : (
            newArrivalsProducts.map((product, idx) => (
              <ProductCard key={`new-${product.id || product.slug || idx}`} product={product} hideActions />
            ))
          )}
        </div>
      </section>


      {/* 6. Promotional Banner */}
      <section className={styles.promoBanner}>
        <h2 className={styles.promoTitle}>Build Your Dream Collection</h2>
        <p className={styles.promoDesc}>
          From legendary JDM icons to exotic supercars, discover your next favourite model.
        </p>
        <Link href="/catalog" className={styles.btnPrimary}>Explore Collection</Link>
      </section>      
      {/* 6.5 Categories */}
     

      {/* 7. Why Diecast Hub */}
      <section id="WhyCollectWithDiecastHub" className={styles.section}>
        <h2 className={styles.sectionTitleCenter} style={{ marginBottom: '48px' }}>Why Collect With Diecast Hub?</h2>
        <div className={styles.featuresGrid}>
          <div>
            <div className={styles.featureIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 className={styles.featureTitle}>Authentic Models</h3>
            <p className={styles.featureDesc}>Genuine products from trusted brands.</p>
          </div>
          <div>
            <div className={styles.featureIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <h3 className={styles.featureTitle}>Secure Packaging</h3>
            <p className={styles.featureDesc}>Carefully packed to protect your collection.</p>
          </div>
          <div>
            <div className={styles.featureIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
            </div>
            <h3 className={styles.featureTitle}>Collector Focused</h3>
            <p className={styles.featureDesc}>Curated models for passionate collectors.</p>
          </div>
          <div>
            <div className={styles.featureIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h3 className={styles.featureTitle}>Secure Payments</h3>
            <p className={styles.featureDesc}>Safe and reliable checkout.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
