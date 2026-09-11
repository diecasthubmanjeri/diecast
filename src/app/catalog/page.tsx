'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Product, collections, Brand, Category, isPreorderProduct, defaultBrands, defaultCategories, defaultScales } from '../../data/products';
import { apiGetProducts, apiGetBrands, apiGetCategories, apiGetScales } from '../../utils/api';
import ProductCard from '../../components/ProductCard';
import ProductSkeleton from '../../components/ProductSkeleton';
import CustomDropdown from '../../components/CustomDropdown';
import styles from './page.module.css';

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [products, setProducts] = useState<Product[]>([]);
  const [localBrands, setLocalBrands] = useState<Brand[]>(defaultBrands);
  const [localCategories, setLocalCategories] = useState<Category[]>(defaultCategories);
  const [localScales, setLocalScales] = useState<string[]>(defaultScales);
  const [loading, setLoading] = useState(true);

  const [inStock, setInStock] = useState(false);
  const [outOfStock, setOutOfStock] = useState(false);
  const [maxPrice, setMaxPrice] = useState('5000');
  
  // Mobile Filter Drawer
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

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
        console.error('Failed to load catalog data', err);
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

  let filteredProducts = [...products];

  const preorderParam = searchParams.get('preorder');
  if (preorderParam === 'true') {
    filteredProducts = filteredProducts.filter(p => isPreorderProduct(p));
  } else {
    // Hide pre-order products by default unless explicitly requested
    filteredProducts = filteredProducts.filter(p => !isPreorderProduct(p));
  }
  
  // 1. URL Parameter Filters
  const brandParam = searchParams.get('brand');
  if (brandParam) {
    const cleanBrandParam = brandParam.replace(/[\s-_]/g, '').toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      (p.brand || '').replace(/[\s-_]/g, '').toLowerCase() === cleanBrandParam
    );
  }
  
  const scaleParam = searchParams.get('scale');
  if (scaleParam) {
    const cleanScaleParam = scaleParam.replace(/[:\s/]/g, '-').toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      (p.scale || '').replace(/[:\s/]/g, '-').toLowerCase() === cleanScaleParam
    );
  }

  const categoryParam = searchParams.get('category');
  if (categoryParam) {
    const cleanCategoryParam = categoryParam.trim().toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      (p.category || '').trim().toLowerCase() === cleanCategoryParam
    );
  }

  const colorParam = searchParams.get('color');
  if (colorParam) {
    filteredProducts = filteredProducts.filter(p => p.colors && p.colors.some(c => c.toLowerCase() === colorParam.toLowerCase()));
  }

  const queryParam = searchParams.get('q');
  if (queryParam) {
    const q = queryParam.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.brand?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.badgeTag?.toLowerCase().includes(q) ||
      p.badge?.toLowerCase().includes(q)
    );
  }

  // 2. Sidebar Filters
  if (inStock || outOfStock) {
    filteredProducts = filteredProducts.filter(p => {
      const isOut = p.stock === 0;
      const isIn = p.stock > 0;
      
      if (inStock && isIn) return true;
      if (outOfStock && isOut) return true;
      return false;
    });
  }

  if (maxPrice && maxPrice !== '5000') {
    filteredProducts = filteredProducts.filter(p => p.price <= parseInt(maxPrice));
  }

  // 3. Sorting
  const sortParam = searchParams.get('sort') || 'featured';
  if (sortParam === 'price-asc') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortParam === 'price-desc') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortParam === 'bestselling') {
    filteredProducts.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
  } else if (sortParam === 'az') {
    filteredProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (sortParam === 'za') {
    filteredProducts.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
  } else if (sortParam === 'date-asc') {
    filteredProducts.sort((a, b) => parseInt(a.id) - parseInt(b.id));
  } else if (sortParam === 'date-desc') {
    filteredProducts.sort((a, b) => parseInt(b.id) - parseInt(a.id));
  }

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const brandOptions = [
    { value: '', label: 'All' },
    ...localBrands.map(b => ({
      value: b.name?.toLowerCase().replaceAll(' ', '-') || '',
      label: b.name || 'Unknown'
    }))
  ];

  const categoryOptions = [
    { value: '', label: 'All' },
    ...localCategories.map(c => ({
      value: c.name,
      label: c.name || 'Unknown'
    }))
  ];

  const allColors = Array.from(new Set(products.flatMap(p => p.colors || []))).sort();
  const colorOptions = [
    { value: '', label: 'All' },
    ...allColors.map(c => ({
      value: c.toLowerCase(),
      label: c
    }))
  ];

  const scaleOptions = [
    { value: '', label: 'All' },
    ...localScales.map(s => ({
      value: s?.replaceAll(':', '-') || '',
      label: s || 'Unknown'
    }))
  ];

  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'relevant', label: 'Most relevant' },
    { value: 'bestselling', label: 'Best selling' },
    { value: 'az', label: 'Alphabetically, A-Z' },
    { value: 'za', label: 'Alphabetically, Z-A' },
    { value: 'price-asc', label: 'Price, low to high' },
    { value: 'price-desc', label: 'Price, high to low' },
    { value: 'date-asc', label: 'Date, old to new' },
    { value: 'date-desc', label: 'Date, new to old' }
  ];

  const highestPrice = products.reduce((max, p) => p.price > max ? p.price : max, 4000);

  const FilterSidebar = () => (
    <div className={styles.filterSidebarContent}>
      <div className={styles.filterSection}>
        <h3 className={styles.filterHeading}>Brand</h3>
        <CustomDropdown 
          label="Select Brand"
          value={brandParam || ''}
          options={brandOptions}
          onChange={(val) => updateParam('brand', val)}
        />
      </div>

      <div className={styles.filterSection}>
        <h3 className={styles.filterHeading}>Category</h3>
        <CustomDropdown 
          label="Select Category"
          value={categoryParam || ''}
          options={categoryOptions}
          onChange={(val) => updateParam('category', val)}
        />
      </div>

      <div className={styles.filterSection}>
        <h3 className={styles.filterHeading}>Color</h3>
        <div className={styles.colorSwatchContainer}>
          {allColors.map(c => {
            const lowerColor = c.toLowerCase();
            const isActive = colorParam?.toLowerCase() === lowerColor;
            
            // Helper to get a safe CSS color from the string
            const getCssColor = (colorName: string) => {
              const name = colorName.toLowerCase();
              if (name.includes('red')) return '#ef4444';
              if (name.includes('blue')) return '#3b82f6';
              if (name.includes('green')) return '#10b981';
              if (name.includes('yellow') || name.includes('gold')) return '#eab308';
              if (name.includes('black')) return '#171717';
              if (name.includes('white')) return '#ffffff';
              if (name.includes('gray') || name.includes('grey') || name.includes('silver')) return '#9ca3af';
              if (name.includes('orange')) return '#f97316';
              return name.replace(/\s+/g, '');
            };

            return (
              <button
                key={c}
                className={`${styles.colorSwatch} ${isActive ? styles.colorSwatchActive : ''}`}
                style={{ backgroundColor: getCssColor(c) }}
                title={c}
                onClick={() => updateParam('color', isActive ? '' : lowerColor)}
                aria-label={`Filter by ${c}`}
              />
            );
          })}
        </div>
      </div>

      <div className={styles.filterSection}>
        <h3 className={styles.filterHeading}>Scale</h3>
        <CustomDropdown 
          label="Select Scale"
          value={scaleParam || ''}
          options={scaleOptions}
          onChange={(val) => updateParam('scale', val)}
        />
      </div>

      <div className={styles.filterSection}>
        <h3 className={styles.filterHeading}>Availability</h3>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
          In stock
        </label>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" checked={outOfStock} onChange={(e) => setOutOfStock(e.target.checked)} />
          Out of stock
        </label>
      </div>

      <div className={styles.filterSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className={styles.filterHeading}>Max Price</h3>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-dark-navy)' }}>₹{maxPrice}</span>
        </div>
        <div className={styles.priceSliderWrapper}>
          <input 
            type="range" 
            min="0" 
            max="5000" 
            step="50" 
            value={maxPrice} 
            onChange={(e) => setMaxPrice(e.target.value)}
            className={styles.priceSlider}
          />
          <div className={styles.priceSliderLabels}>
            <span>₹0</span>
            <span>₹5000</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.shopContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Products</h1>
      </div>
      
      <div className={styles.filterBar}>
        <div className={styles.filterLeft}>
          <button className={styles.mobileFilterBtn} onClick={() => setIsMobileFilterOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Filter
          </button>
        </div>

        <div className={styles.filterRight}>
          <span className={styles.resultCount}>{filteredProducts.length} items</span>
          <div className={styles.sortDropdownWrapper}>
            <span style={{ fontSize: '14px', color: '#666', marginRight: '8px' }}>Sort by:</span>
            <CustomDropdown 
              label="Sort"
              value={sortParam}
              options={sortOptions}
              onChange={(val) => updateParam('sort', val)}
            />
          </div>
        </div>
      </div>
      
      <div className={styles.catalogLayout}>
        <aside className={styles.sidebar}>
          <FilterSidebar />
        </aside>
        
        <div className={styles.productArea}>
          <div className={styles.grid}>
            {loading && products.length === 0 ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <ProductSkeleton key={`cat-skel-${idx}`} />
              ))
            ) : (
              filteredProducts.map((product, idx) => (
                <ProductCard key={`cat-${product.id || product.slug || idx}`} product={product} />
              ))
            )}
            {!loading && filteredProducts.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '40px 0', textAlign: 'center' }}>
                <h3>No cars found</h3>
                <p>Try adjusting your filters to see more results.</p>
                <button 
                  onClick={() => {
                    setInStock(false);
                    setOutOfStock(false);
                    setMaxPrice('5000');
                    router.push(pathname);
                  }} 
                  style={{ color: 'var(--color-primary-light-blue)', marginTop: '16px', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileFilterOpen && (
        <div className={styles.mobileDrawerOverlay} onClick={() => setIsMobileFilterOpen(false)}>
          <div className={styles.mobileDrawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mobileDrawerHeader}>
              <h2>Filter</h2>
              <button className={styles.closeDrawerBtn} onClick={() => setIsMobileFilterOpen(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className={styles.mobileDrawerContent}>
              <FilterSidebar />
            </div>
            <div className={styles.mobileDrawerFooter}>
              <button className={styles.applyFiltersBtn} onClick={() => setIsMobileFilterOpen(false)}>
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { Suspense } from 'react';

export default function Catalog() {
  return (
    <Suspense fallback={<div style={{ padding: '100px', textAlign: 'center' }}>Loading catalog...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
