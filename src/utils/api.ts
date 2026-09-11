import { Product, Brand, Category } from '../data/products';

export interface NewsItem {
  id: string;
  text: string;
}

export interface Banner {
  id: string;
  italicTitle: string;
  mainTitle: string;
  subTitle: string;
  promoEmoji: string;
  noCouponText: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  scale?: string;
  color?: string;
}

export interface Order {
  id: string;
  date: string;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  shippingPartner?: string;
  product?: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
  items?: OrderItem[];
  subtotal?: number;
  discountAmount?: number;
  offerApplied?: string;
  totalAmount: number;
  trackingId?: string;
  paymentMethod?: string;
  paymentStatus?: 'Paid' | 'Pending' | 'Failed';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

export interface Offer {
  id: string;
  minPurchaseAmount: number;
  discountPercentage: number;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BestSellingItem {
  productId: string;
  productName: string;
  productImage?: string;
  productBrand?: string;
  productScale?: string;
  productPrice?: number;
  stock: number;
  isBestseller: boolean;
  uniqueClientsCount: number;
  totalAdditions: number;
  lastAddedAt?: string | null;
}

export interface BestSellingData {
  items: BestSellingItem[];
  summary: {
    topMovingProduct: BestSellingItem | null;
    totalClientsEngaged: number;
    totalCartAdditions: number;
    totalTrackedProducts: number;
  };
}

// ---------------- PRODUCTS ----------------
export async function apiGetProducts(params?: Record<string, string>): Promise<Product[]> {
  try {
    const search = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`/api/products${search}`, { cache: 'no-store' });
    const data = await res.json();
    if (!data.success || !Array.isArray(data.data)) return [];

    // Client-side deduplication safeguard to guarantee unique items
    const seen = new Set<string>();
    const unique: Product[] = [];
    for (const p of data.data) {
      const key = p.id || (p as unknown as { _id?: string })._id || p.slug;
      if (key && !seen.has(key)) {
        seen.add(key);
        unique.push(p);
      }
    }
    return unique;
  } catch (err) {
    console.error('[API fetch products error]', err);
    return [];
  }
}

export async function apiGetProduct(idOrSlug: string): Promise<Product | null> {
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(idOrSlug)}`, { cache: 'no-store' });
    const data = await res.json();
    return data.success && data.data ? data.data : null;
  } catch (err) {
    console.error('[API fetch single product error]', err);
    return null;
  }
}

export async function apiSaveProduct(product: Partial<Product>): Promise<Product | null> {
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to save product');
    return data.data;
  } catch (err) {
    console.error('[API save product error]', err);
    throw err;
  }
}

export async function apiDeleteProduct(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('[API delete product error]', err);
    return false;
  }
}

// ---------------- BRANDS ----------------
export async function apiGetBrands(): Promise<Brand[]> {
  try {
    const res = await fetch('/api/brands', { cache: 'no-store' });
    const data = await res.json();
    return data.success && Array.isArray(data.data) ? data.data : [];
  } catch (err) {
    console.error('[API fetch brands error]', err);
    return [];
  }
}

export async function apiSaveBrand(brand: { name: string; logo?: string }): Promise<Brand | null> {
  try {
    const res = await fetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brand),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to save brand');
    return data.data;
  } catch (err) {
    console.error('[API save brand error]', err);
    throw err;
  }
}

export async function apiDeleteBrand(name: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/brands/${encodeURIComponent(name)}`, { method: 'DELETE' });
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('[API delete brand error]', err);
    return false;
  }
}

// ---------------- CATEGORIES ----------------
export async function apiGetCategories(): Promise<Category[]> {
  try {
    const res = await fetch('/api/categories', { cache: 'no-store' });
    const data = await res.json();
    return data.success && Array.isArray(data.data) ? data.data : [];
  } catch (err) {
    console.error('[API fetch categories error]', err);
    return [];
  }
}

export async function apiSaveCategory(cat: { name: string; image: string; subtitle?: string }): Promise<Category | null> {
  try {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to save category');
    return data.data;
  } catch (err) {
    console.error('[API save category error]', err);
    throw err;
  }
}

export async function apiDeleteCategory(name: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/categories/${encodeURIComponent(name)}`, { method: 'DELETE' });
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('[API delete category error]', err);
    return false;
  }
}

// ---------------- SCALES ----------------
export async function apiGetScales(): Promise<string[]> {
  try {
    const res = await fetch('/api/scales', { cache: 'no-store' });
    const data = await res.json();
    return data.success && Array.isArray(data.data) ? data.data : [];
  } catch (err) {
    console.error('[API fetch scales error]', err);
    return [];
  }
}

export async function apiAddScale(name: string): Promise<string | null> {
  try {
    const res = await fetch('/api/scales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to add scale');
    return data.data;
  } catch (err) {
    console.error('[API add scale error]', err);
    throw err;
  }
}

export async function apiDeleteScale(name: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/scales/${encodeURIComponent(name)}`, { method: 'DELETE' });
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('[API delete scale error]', err);
    return false;
  }
}

// ---------------- NEWS ----------------
export async function apiGetNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch('/api/news', { cache: 'no-store' });
    const data = await res.json();
    return data.success && Array.isArray(data.data) ? data.data : [];
  } catch (err) {
    console.error('[API fetch news error]', err);
    return [];
  }
}

export async function apiSaveNews(item: { id?: string; text: string }): Promise<NewsItem | null> {
  try {
    const res = await fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to save news');
    return data.data;
  } catch (err) {
    console.error('[API save news error]', err);
    throw err;
  }
}

export async function apiDeleteNews(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/news/${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('[API delete news error]', err);
    return false;
  }
}

// ---------------- BANNERS ----------------
export async function apiGetBanners(): Promise<Banner[]> {
  try {
    const res = await fetch('/api/banners', { cache: 'no-store' });
    const data = await res.json();
    return data.success && Array.isArray(data.data) ? data.data : [];
  } catch (err) {
    console.error('[API fetch banners error]', err);
    return [];
  }
}

// ---------------- CLOUDINARY UPLOAD ----------------
export async function apiUploadImage(file: File, folder: string = 'diecast/products'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!data.success || !data.url) {
    throw new Error(data.error || 'Image upload failed');
  }

  return data.url;
}

// ---------------- ORDERS ----------------
export async function apiGetUserOrders(): Promise<Order[]> {
  try {
    const res = await fetch('/api/orders', { cache: 'no-store' });
    const data = await res.json();
    return data.success && Array.isArray(data.data) ? data.data : [];
  } catch (err) {
    console.error('[API fetch user orders error]', err);
    return [];
  }
}

export async function apiCreateOrder(orderData: any): Promise<Order> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to place order');
  }
  return data.data;
}

export async function apiGetAdminOrders(status?: string): Promise<Order[]> {
  try {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`/api/admin/orders${q}`, { cache: 'no-store' });
    const data = await res.json();
    return data.success && Array.isArray(data.data) ? data.data : [];
  } catch (err) {
    console.error('[API admin orders error]', err);
    return [];
  }
}

export async function apiUpdateOrderStatus(orderId: string, status: Order['status'], trackingId?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, trackingId }),
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('[API update order status error]', err);
    return false;
  }
}

// ---------------- OFFERS ----------------

export async function apiGetOffers(): Promise<Offer[]> {
  try {
    const res = await fetch('/api/offers', { cache: 'no-store' });
    const data = await res.json();
    return data.success && Array.isArray(data.data) ? data.data : [];
  } catch (err) {
    console.error('[API fetch offers error]', err);
    return [];
  }
}

export async function apiGetAdminOffers(): Promise<Offer[]> {
  try {
    const res = await fetch('/api/admin/offers', { cache: 'no-store' });
    const data = await res.json();
    return data.success && Array.isArray(data.data) ? data.data : [];
  } catch (err) {
    console.error('[API fetch admin offers error]', err);
    return [];
  }
}

export async function apiSaveOffer(offer: {
  minPurchaseAmount: number;
  discountPercentage: number;
  title?: string;
  description?: string;
}): Promise<Offer | null> {
  try {
    const res = await fetch('/api/admin/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offer),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to save offer');
    return data.data;
  } catch (err) {
    console.error('[API save offer error]', err);
    throw err;
  }
}

export async function apiToggleOffer(id: string, isActive: boolean): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/offers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive }),
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('[API toggle offer error]', err);
    return false;
  }
}

export async function apiDeleteOffer(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/admin/offers?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('[API delete offer error]', err);
    return false;
  }
}

// ---------------- BEST SELLING ANALYTICS ----------------

export async function apiGetBestSellingStats(): Promise<BestSellingData | null> {
  try {
    const res = await fetch('/api/admin/bestselling', { cache: 'no-store' });
    const data = await res.json();
    return data.success && data.data ? data.data : null;
  } catch (err) {
    console.error('[API fetch best selling error]', err);
    return null;
  }
}

