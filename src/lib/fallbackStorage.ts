import fs from 'fs';
import path from 'path';
import { Product, defaultBrands, defaultCategories, defaultScales } from '@/data/products';

export interface FallbackOffer {
  id: string;
  minPurchaseAmount: number;
  discountPercentage: number;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FallbackCartItem {
  id: string;
  name: string;
  scale: string;
  price: number;
  quantity: number;
  image: string;
  color?: string;
  stock?: number;
}

export interface FallbackCart {
  sessionId: string;
  items: FallbackCartItem[];
  updatedAt: string;
}

export interface FallbackCartStat {
  productId: string;
  productName: string;
  productImage?: string;
  productScale?: string;
  productBrand?: string;
  productPrice?: number;
  clientSessionIds: string[];
  uniqueClientsCount: number;
  totalAdditions: number;
  lastAddedAt: string;
}

export interface FallbackAdmin {
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  passwordVersion: number;
  otpHash?: string;
  otpExpiresAt?: string;
  otpAttempts?: number;
  otpLastSentAt?: string;
  updatedAt: string;
}

export interface FallbackData {
  products: Product[];
  orders: any[];
  brands: { name: string; logo?: string }[];
  categories: { name: string; image?: string; subtitle?: string }[];
  scales: string[];
  banners: any[];
  news: any[];
  offers?: FallbackOffer[];
  carts?: FallbackCart[];
  cartAnalytics?: FallbackCartStat[];
  admin?: FallbackAdmin;
}

const DEFAULT_BANNERS = [
  {
    id: '1',
    italicTitle: '5% off on Minimum Order of 949.',
    mainTitle: '10% off on Minimum Order of 2000.',
    subTitle: 'Free Shipping on Prepaid Orders Above 949',
    promoEmoji: '🎁',
    noCouponText: 'No Coupon Code Required',
    order: 0,
    active: true,
  },
  {
    id: '2',
    italicTitle: 'Welcome to Diecast Hub.',
    mainTitle: 'Premium Models from Top Brands.',
    subTitle: 'Discover your next favorite collectible today.',
    promoEmoji: '🏎️',
    noCouponText: 'Shop Now',
    order: 1,
    active: true,
  },
];

const DEFAULT_NEWS = [
  { id: '1', text: '🚨 Big Sale: Up to 50% off on all 1/18 scale models!' },
  { id: '2', text: '🚗 New arrivals from Hot Wheels and Matchbox just landed!' },
  { id: '3', text: '✨ Free shipping on orders over ₹2000!' },
  { id: '4', text: '🔥 Pre-order the exclusive 2024 limited editions now!' },
];

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

function ensureDataFile(): FallbackData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      const initialData: FallbackData = {
        products: [],
        orders: [],
        brands: defaultBrands,
        categories: defaultCategories,
        scales: defaultScales,
        banners: DEFAULT_BANNERS,
        news: DEFAULT_NEWS,
        offers: [],
        carts: [],
        cartAnalytics: [],
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }

    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    return {
      products: Array.isArray(parsed.products) ? parsed.products : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      brands: Array.isArray(parsed.brands) ? parsed.brands : defaultBrands,
      categories: Array.isArray(parsed.categories) ? parsed.categories : defaultCategories,
      scales: Array.isArray(parsed.scales) ? parsed.scales : defaultScales,
      banners: Array.isArray(parsed.banners) ? parsed.banners : DEFAULT_BANNERS,
      news: Array.isArray(parsed.news) ? parsed.news : DEFAULT_NEWS,
      offers: Array.isArray(parsed.offers) ? parsed.offers : [],
      carts: Array.isArray(parsed.carts) ? parsed.carts : [],
      cartAnalytics: Array.isArray(parsed.cartAnalytics) ? parsed.cartAnalytics : [],
    };
  } catch (err) {
    console.error('[FallbackStorage] Error reading fallback data file:', err);
    return {
      products: [],
      orders: [],
      brands: defaultBrands,
      categories: defaultCategories,
      scales: defaultScales,
      banners: DEFAULT_BANNERS,
      news: DEFAULT_NEWS,
      offers: [],
      carts: [],
      cartAnalytics: [],
    };
  }
}

function writeDataFile(data: FallbackData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[FallbackStorage] Error writing fallback data file:', err);
  }
}

// ---------------- PRODUCTS ----------------

export function getFallbackProducts(filters?: {
  category?: string | null;
  brand?: string | null;
  scale?: string | null;
  q?: string | null;
  preorder?: string | null;
  inStock?: string | null;
}): Product[] {
  const data = ensureDataFile();
  let result = [...data.products];

  if (filters?.category) {
    const c = filters.category.toLowerCase();
    result = result.filter((p) => p.category?.toLowerCase() === c);
  }
  if (filters?.brand) {
    const b = filters.brand.toLowerCase();
    result = result.filter((p) => p.brand?.toLowerCase() === b);
  }
  if (filters?.scale) {
    const s = filters.scale.toLowerCase();
    result = result.filter((p) => p.scale?.toLowerCase() === s);
  }
  if (filters?.preorder === 'true') {
    result = result.filter((p) => p.isPreorder);
  } else if (filters?.preorder === 'false') {
    result = result.filter((p) => !p.isPreorder);
  }
  if (filters?.inStock === 'true') {
    result = result.filter((p) => (p.stock || 0) > 0);
  }
  if (filters?.q && filters.q.trim()) {
    const q = filters.q.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.model?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    );
  }

  return result;
}

export function getFallbackProductById(idOrSlug: string): Product | null {
  const data = ensureDataFile();
  const decoded = decodeURIComponent(idOrSlug).trim().toLowerCase();
  return (
    data.products.find(
      (p) => p.id?.toLowerCase() === decoded || p.slug?.toLowerCase() === decoded
    ) || null
  );
}

export function saveFallbackProduct(body: any): Product {
  const data = ensureDataFile();
  const id = body.id || Date.now().toString();
  const baseSlug = (body.slug || body.name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

  let slug = baseSlug;
  let counter = 1;
  while (data.products.some((p) => p.slug === slug && p.id !== id)) {
    slug = `${baseSlug}-${counter++}`;
  }

  const now = new Date().toISOString();
  const newProduct: Product = {
    id,
    name: (body.name || '').trim(),
    slug,
    brand: body.brand || '',
    scale: body.scale || '',
    price: Number(body.price) || 0,
    originalPrice: body.originalPrice !== undefined ? Number(body.originalPrice) : undefined,
    discount: body.discount !== undefined ? Number(body.discount) : undefined,
    stock: Number(body.stock) || 0,
    rating: typeof body.rating === 'number' ? body.rating : 5,
    reviews: typeof body.reviews === 'number' ? body.reviews : 0,
    model: body.model || '',
    category: body.category || '',
    image: body.image || '',
    gallery: Array.isArray(body.gallery) ? body.gallery : [],
    isNew: Boolean(body.isNew),
    isBestseller: Boolean(body.isBestseller),
    badge: body.badge || '',
    badgeTag: body.badgeTag || '',
    isPreorder: Boolean(body.isPreorder),
    releaseDate: body.releaseDate || '',
    preorderAmount: Number(body.preorderAmount) || 0,
    colors: Array.isArray(body.colors) ? body.colors : [],
    material: body.material !== undefined ? String(body.material).trim() : 'Diecast Metal with Plastic Parts',
    description: body.description !== undefined ? String(body.description).trim() : '',
  };

  const existingIdx = data.products.findIndex((p) => p.id === id);
  if (existingIdx >= 0) {
    data.products[existingIdx] = { ...data.products[existingIdx], ...newProduct };
  } else {
    data.products.unshift(newProduct);
  }

  // Auto-register scale, brand, category if new
  if (newProduct.scale && !data.scales.includes(newProduct.scale)) {
    data.scales.push(newProduct.scale);
  }
  if (newProduct.brand && !data.brands.some((b) => b.name.toLowerCase() === newProduct.brand.toLowerCase())) {
    data.brands.push({ name: newProduct.brand, logo: '' });
  }
  if (newProduct.category && !data.categories.some((c) => c.name.toLowerCase() === newProduct.category.toLowerCase())) {
    data.categories.push({ name: newProduct.category, image: '' });
  }

  writeDataFile(data);
  return newProduct;
}

export function updateFallbackProduct(idOrSlug: string, updates: any): Product | null {
  const data = ensureDataFile();
  const decoded = decodeURIComponent(idOrSlug).trim().toLowerCase();
  const idx = data.products.findIndex(
    (p) => p.id?.toLowerCase() === decoded || p.slug?.toLowerCase() === decoded
  );
  if (idx === -1) return null;

  data.products[idx] = { ...data.products[idx], ...updates };
  writeDataFile(data);
  return data.products[idx];
}

export function deleteFallbackProduct(idOrSlug: string): boolean {
  const data = ensureDataFile();
  const decoded = decodeURIComponent(idOrSlug).trim().toLowerCase();
  const initialLength = data.products.length;
  data.products = data.products.filter(
    (p) => p.id?.toLowerCase() !== decoded && p.slug?.toLowerCase() !== decoded
  );
  if (data.products.length !== initialLength) {
    writeDataFile(data);
    return true;
  }
  return false;
}

// ---------------- ORDERS ----------------

export function getFallbackOrders(filter?: {
  status?: string;
  sessionId?: string;
  phone?: string;
  email?: string;
}): any[] {
  const data = ensureDataFile();
  let result = [...data.orders];

  if (filter?.status) {
    result = result.filter((o) => o.status === filter.status);
  }
  if (filter?.sessionId || filter?.phone || filter?.email) {
    result = result.filter((o) => {
      const matchSession = filter.sessionId && o.sessionId === filter.sessionId;
      const matchPhone = filter.phone && o.customerPhone === filter.phone;
      const matchEmail =
        filter.email && o.customerEmail?.toLowerCase() === filter.email.toLowerCase();
      return matchSession || matchPhone || matchEmail;
    });
  }

  return result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

export function saveFallbackOrder(orderData: any): any {
  const data = ensureDataFile();
  const order = {
    ...orderData,
    id: orderData.id || `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    status: orderData.status || 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.orders.unshift(order);
  writeDataFile(data);
  return order;
}

export function updateFallbackOrderStatus(id: string, updates: any): any | null {
  const data = ensureDataFile();
  const idx = data.orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;

  data.orders[idx] = {
    ...data.orders[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeDataFile(data);
  return data.orders[idx];
}

export function deleteFallbackOrder(id: string): boolean {
  const data = ensureDataFile();
  const initLen = data.orders.length;
  data.orders = data.orders.filter((o) => o.id !== id);
  if (data.orders.length !== initLen) {
    writeDataFile(data);
    return true;
  }
  return false;
}

// ---------------- BRANDS ----------------

export function getFallbackBrands(): any[] {
  const data = ensureDataFile();
  return data.brands;
}

export function saveFallbackBrand(brand: { name: string; logo?: string }): any {
  const data = ensureDataFile();
  const existing = data.brands.find((b) => b.name.toLowerCase() === brand.name.toLowerCase());
  if (existing) return null; // already exists
  data.brands.push({ name: brand.name.trim(), logo: brand.logo || '' });
  writeDataFile(data);
  return { name: brand.name.trim(), logo: brand.logo || '' };
}

export function deleteFallbackBrand(name: string): boolean {
  const data = ensureDataFile();
  const initLen = data.brands.length;
  data.brands = data.brands.filter((b) => b.name.toLowerCase() !== decodeURIComponent(name).toLowerCase());
  if (data.brands.length !== initLen) {
    writeDataFile(data);
    return true;
  }
  return false;
}

// ---------------- CATEGORIES ----------------

export function getFallbackCategories(): any[] {
  const data = ensureDataFile();
  return data.categories;
}

export function saveFallbackCategory(cat: { name: string; image?: string; subtitle?: string }): any {
  const data = ensureDataFile();
  const existing = data.categories.find((c) => c.name.toLowerCase() === cat.name.toLowerCase());
  if (existing) return null;
  const newCat = { name: cat.name.trim(), image: cat.image || '', subtitle: cat.subtitle || '' };
  data.categories.push(newCat);
  writeDataFile(data);
  return newCat;
}

export function deleteFallbackCategory(name: string): boolean {
  const data = ensureDataFile();
  const initLen = data.categories.length;
  data.categories = data.categories.filter((c) => c.name.toLowerCase() !== decodeURIComponent(name).toLowerCase());
  if (data.categories.length !== initLen) {
    writeDataFile(data);
    return true;
  }
  return false;
}

// ---------------- SCALES ----------------

export function getFallbackScales(): string[] {
  const data = ensureDataFile();
  return data.scales;
}

export function saveFallbackScale(scaleName: string): boolean {
  const data = ensureDataFile();
  const trimmed = scaleName.trim();
  if (data.scales.includes(trimmed)) return false;
  data.scales.push(trimmed);
  writeDataFile(data);
  return true;
}

export function deleteFallbackScale(scaleName: string): boolean {
  const data = ensureDataFile();
  const initLen = data.scales.length;
  data.scales = data.scales.filter((s) => s !== decodeURIComponent(scaleName));
  if (data.scales.length !== initLen) {
    writeDataFile(data);
    return true;
  }
  return false;
}

// ---------------- BANNERS ----------------

export function getFallbackBanners(): any[] {
  const data = ensureDataFile();
  return data.banners;
}

export function saveFallbackBanners(banners: any[]): any[] {
  const data = ensureDataFile();
  data.banners = banners;
  writeDataFile(data);
  return data.banners;
}

// ---------------- NEWS ----------------

export function getFallbackNews(): any[] {
  const data = ensureDataFile();
  return data.news;
}

export function saveFallbackNews(item: any): any {
  const data = ensureDataFile();
  const id = item.id || Date.now().toString();
  const newItem = { id, text: item.text };
  const idx = data.news.findIndex((n) => n.id === id);
  if (idx >= 0) {
    data.news[idx] = newItem;
  } else {
    data.news.push(newItem);
  }
  writeDataFile(data);
  return newItem;
}

export function deleteFallbackNews(id: string): boolean {
  const data = ensureDataFile();
  const initLen = data.news.length;
  data.news = data.news.filter((n) => n.id !== id);
  if (data.news.length !== initLen) {
    writeDataFile(data);
    return true;
  }
  return false;
}

// ---------------- OFFERS ----------------

export function getFallbackOffers(activeOnly = false): FallbackOffer[] {
  const data = ensureDataFile();
  const offers = Array.isArray(data.offers) ? data.offers : [];
  if (activeOnly) {
    return offers.filter((o) => o.isActive);
  }
  return offers;
}

export function saveFallbackOffer(offerData: {
  id?: string;
  minPurchaseAmount: number;
  discountPercentage: number;
  title?: string;
  description?: string;
  isActive?: boolean;
}): FallbackOffer {
  const data = ensureDataFile();
  if (!Array.isArray(data.offers)) {
    data.offers = [];
  }

  const id = offerData.id || `OFFER_${Date.now()}`;
  const title =
    offerData.title ||
    `${offerData.discountPercentage}% OFF on orders ₹${offerData.minPurchaseAmount.toLocaleString('en-IN')}+`;

  const newOffer: FallbackOffer = {
    id,
    minPurchaseAmount: Number(offerData.minPurchaseAmount),
    discountPercentage: Number(offerData.discountPercentage),
    title,
    description: offerData.description || '',
    isActive: offerData.isActive !== undefined ? Boolean(offerData.isActive) : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const existingIdx = data.offers.findIndex((o) => o.id === id);
  if (existingIdx >= 0) {
    data.offers[existingIdx] = {
      ...data.offers[existingIdx],
      ...newOffer,
      createdAt: data.offers[existingIdx].createdAt,
      updatedAt: new Date().toISOString(),
    };
  } else {
    data.offers.unshift(newOffer);
  }

  writeDataFile(data);
  return newOffer;
}

export function deleteFallbackOffer(id: string): boolean {
  const data = ensureDataFile();
  if (!Array.isArray(data.offers)) return false;
  const initLen = data.offers.length;
  data.offers = data.offers.filter((o) => o.id !== id);
  if (data.offers.length !== initLen) {
    writeDataFile(data);
    return true;
  }
  return false;
}

export function toggleFallbackOffer(id: string, isActive: boolean): FallbackOffer | null {
  const data = ensureDataFile();
  if (!Array.isArray(data.offers)) return null;
  const idx = data.offers.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  data.offers[idx].isActive = isActive;
  data.offers[idx].updatedAt = new Date().toISOString();
  writeDataFile(data);
  return data.offers[idx];
}

// ---------------- CARTS ----------------

export function getFallbackCart(sessionId: string): FallbackCartItem[] {
  const data = ensureDataFile();
  if (!Array.isArray(data.carts)) return [];
  const cart = data.carts.find((c) => c.sessionId === sessionId);
  return cart && Array.isArray(cart.items) ? cart.items : [];
}

export function saveFallbackCart(sessionId: string, items: FallbackCartItem[]): FallbackCartItem[] {
  const data = ensureDataFile();
  if (!Array.isArray(data.carts)) data.carts = [];
  const idx = data.carts.findIndex((c) => c.sessionId === sessionId);
  if (idx >= 0) {
    data.carts[idx].items = items;
    data.carts[idx].updatedAt = new Date().toISOString();
  } else {
    data.carts.push({
      sessionId,
      items,
      updatedAt: new Date().toISOString(),
    });
  }
  writeDataFile(data);
  return items;
}

// ---------------- CART ANALYTICS (BEST SELLING) ----------------

export function recordFallbackCartAddition(
  productId: string,
  productName: string,
  productImage = '',
  productScale = '',
  productBrand = '',
  productPrice = 0,
  sessionId = ''
): FallbackCartStat {
  const data = ensureDataFile();
  if (!Array.isArray(data.cartAnalytics)) data.cartAnalytics = [];

  let stat = data.cartAnalytics.find((s) => s.productId === productId);
  if (!stat) {
    stat = {
      productId,
      productName,
      productImage,
      productScale,
      productBrand,
      productPrice,
      clientSessionIds: sessionId ? [sessionId] : [],
      uniqueClientsCount: sessionId ? 1 : 0,
      totalAdditions: 1,
      lastAddedAt: new Date().toISOString(),
    };
    data.cartAnalytics.push(stat);
  } else {
    stat.productName = productName || stat.productName;
    stat.productImage = productImage || stat.productImage;
    stat.productScale = productScale || stat.productScale;
    stat.productBrand = productBrand || stat.productBrand;
    stat.productPrice = productPrice || stat.productPrice;
    stat.totalAdditions = (stat.totalAdditions || 0) + 1;
    stat.lastAddedAt = new Date().toISOString();
    if (!Array.isArray(stat.clientSessionIds)) {
      stat.clientSessionIds = [];
    }
    if (sessionId && !stat.clientSessionIds.includes(sessionId)) {
      stat.clientSessionIds.push(sessionId);
    }
    stat.uniqueClientsCount = stat.clientSessionIds.length;
  }

  writeDataFile(data);
  return stat;
}

export function getFallbackCartAnalytics(): FallbackCartStat[] {
  const data = ensureDataFile();
  if (!Array.isArray(data.cartAnalytics)) return [];
  // Sort descending by unique client count, then total additions
  return [...data.cartAnalytics].sort((a, b) => {
    if (b.uniqueClientsCount !== a.uniqueClientsCount) {
      return b.uniqueClientsCount - a.uniqueClientsCount;
    }
    return (b.totalAdditions || 0) - (a.totalAdditions || 0);
  });
}

export function getFallbackAdmin(): FallbackAdmin | null {
  const data = ensureDataFile();
  return data.admin || null;
}

export function saveFallbackAdmin(adminData: Partial<FallbackAdmin>): FallbackAdmin {
  const data = ensureDataFile();
  const existing = data.admin || {
    username: 'diecasthubmanjeri',
    email: 'diecasthubmanjeri@gmail.com',
    passwordHash: '',
    salt: '',
    passwordVersion: 1,
    updatedAt: new Date().toISOString(),
  };

  data.admin = {
    ...existing,
    ...adminData,
    updatedAt: new Date().toISOString(),
  };

  writeDataFile(data);
  return data.admin;
}

export interface FallbackReservation {
  razorpayOrderId: string;
  items: { productId: string; quantity: number }[];
  expiresAt: number;
}

let inMemoryFallbackReservations: FallbackReservation[] = [];

export function getActiveFallbackReservations(productId: string): number {
  const now = Date.now();
  inMemoryFallbackReservations = inMemoryFallbackReservations.filter((r) => r.expiresAt > now);
  return inMemoryFallbackReservations.reduce((sum, r) => {
    const item = r.items.find((i) => i.productId === productId);
    return sum + (item ? item.quantity : 0);
  }, 0);
}

export function saveFallbackReservation(reservation: FallbackReservation): void {
  const now = Date.now();
  inMemoryFallbackReservations = inMemoryFallbackReservations.filter((r) => r.expiresAt > now);
  inMemoryFallbackReservations.push(reservation);
}

export function removeFallbackReservation(razorpayOrderId: string): void {
  inMemoryFallbackReservations = inMemoryFallbackReservations.filter(
    (r) => r.razorpayOrderId !== razorpayOrderId
  );
}

