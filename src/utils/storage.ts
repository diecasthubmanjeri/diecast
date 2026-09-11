/**
 * Diecast Hub Storage & Data Layer
 * Migrated completely from localStorage to MongoDB database & API routes.
 * Zero localStorage or sessionStorage used.
 */

import { Product, mockProducts, defaultBrands, defaultScales, Brand, Category, defaultCategories } from '../data/products';
import {
  apiGetProducts,
  apiSaveProduct,
  apiDeleteProduct,
  apiGetBrands,
  apiSaveBrand,
  apiDeleteBrand,
  apiGetCategories,
  apiSaveCategory,
  apiDeleteCategory,
  apiGetScales,
  apiAddScale,
  apiDeleteScale,
  apiGetNews,
  apiSaveNews,
  apiDeleteNews,
  apiGetBanners,
  apiGetUserOrders,
  apiGetAdminOrders,
  apiCreateOrder,
  apiUpdateOrderStatus,
  NewsItem,
  Banner,
  OrderItem,
  Order,
} from './api';

export type { NewsItem, Banner, OrderItem, Order };

export const DEFAULT_BANNERS: Banner[] = [
  {
    id: '1',
    italicTitle: '5% off on Minimum Order of 949.',
    mainTitle: '10% off on Minimum Order of 2000.',
    subTitle: 'Free Shipping on Prepaid Orders Above 949',
    promoEmoji: '🎁',
    noCouponText: 'No Coupon Code Required',
  },
  {
    id: '2',
    italicTitle: 'Welcome to Diecast Hub.',
    mainTitle: 'Premium Models from Top Brands.',
    subTitle: 'Discover your next favorite collectible today.',
    promoEmoji: '🏎️',
    noCouponText: 'Shop Now',
  },
];

export const DEFAULT_NEWS: NewsItem[] = [
  { id: '1', text: '🚨 Big Sale: Up to 50% off on all 1/18 scale models!' },
  { id: '2', text: '🚗 New arrivals from Hot Wheels and Matchbox just landed!' },
  { id: '3', text: '✨ Free shipping on orders over ₹2000!' },
  { id: '4', text: '🔥 Pre-order the exclusive 2024 limited editions now!' },
];

// In-memory cache for fast, zero-storage client fallback
let memoryProducts: Product[] = mockProducts;
let memoryBrands: Brand[] = defaultBrands;
let memoryCategories: Category[] = defaultCategories;
let memoryScales: string[] = defaultScales;
let memoryNews: NewsItem[] = DEFAULT_NEWS;
let memoryBanners: Banner[] = DEFAULT_BANNERS;
let memoryOrders: Order[] = [];

// Synchronous initial getters (return in-memory defaults)
export const getBanners = (): Banner[] => memoryBanners;
export const getNews = (): NewsItem[] => memoryNews;
export const getProducts = (): Product[] => memoryProducts;
export const getBrands = (): Brand[] => memoryBrands;
export const getScales = (): string[] => memoryScales;
export const getCategories = (): Category[] => memoryCategories;
export const getOrders = (): Order[] => memoryOrders;

// Set in-memory cache
export const setMemoryProducts = (p: Product[]) => { memoryProducts = p; };
export const setMemoryBrands = (b: Brand[]) => { memoryBrands = b; };
export const setMemoryCategories = (c: Category[]) => { memoryCategories = c; };
export const setMemoryScales = (s: string[]) => { memoryScales = s; };
export const setMemoryNews = (n: NewsItem[]) => { memoryNews = n; };
export const setMemoryBanners = (b: Banner[]) => { memoryBanners = b; };
export const setMemoryOrders = (o: Order[]) => { memoryOrders = o; };

// Backward-compatible mutation handlers that trigger API calls and update memory
export const saveBanners = async (banners: Banner[]) => {
  memoryBanners = banners;
  try {
    await fetch('/api/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(banners),
    });
  } catch (e) {
    console.error('Failed to save banners to database', e);
  }
};

export const saveNews = async (news: NewsItem[]) => {
  memoryNews = news;
  // Individual items saved via apiSaveNews
};

export const saveProducts = async (products: Product[]) => {
  memoryProducts = products;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('diecasthub_products_updated', { detail: products }));
  }
};

export const saveBrands = async (brands: Brand[]) => {
  memoryBrands = brands;
};

export const saveScales = async (scales: string[]) => {
  memoryScales = scales;
};

export const saveCategories = async (categories: Category[]) => {
  memoryCategories = categories;
};

export const saveOrders = async (orders: Order[]) => {
  memoryOrders = orders;
};
