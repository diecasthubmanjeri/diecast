'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Product, collections, Brand, isPreorderProduct, Category } from '../../data/products';
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
  apiGetAdminOrders,
  apiUpdateOrderStatus,
  apiUploadImage,
  apiGetAdminOffers,
  apiSaveOffer,
  apiToggleOffer,
  apiDeleteOffer,
  apiGetBestSellingStats,
  NewsItem,
  Order,
  Offer,
  BestSellingData,
} from '../../utils/api';
import { toast } from 'react-hot-toast';
import { processFileToTransparentPng } from '../../utils/image';
import TransparentCategoryImg from '../../components/TransparentCategoryImg';
import AdminLogin from './AdminLogin';
import styles from './page.module.css';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'brand' | 'category' | 'scale' | 'news' | 'notifications' | 'bestselling' | 'offer'>('inventory');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/check', { cache: 'no-store' });
        const data = await res.json();
        setIsAuthenticated(Boolean(data.authenticated));
      } catch (err) {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (_) {}
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };
  
  // Sound & Live Notification State
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [, setAudioReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialOrderLoadRef = useRef(true);

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // News State
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);

  // Offers State
  const [offers, setOffers] = useState<Offer[]>([]);
  const [newOfferPurchaseAmount, setNewOfferPurchaseAmount] = useState('2000');
  const [newOfferPercentage, setNewOfferPercentage] = useState('10');
  const [isSavingOffer, setIsSavingOffer] = useState(false);

  // Best Selling Analytics State
  const [bestSellingData, setBestSellingData] = useState<BestSellingData | null>(null);
  const [bestSellingSearch, setBestSellingSearch] = useState('');

  // Metadata State
  const [localBrands, setLocalBrands] = useState<Brand[]>([]);
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [localScales, setLocalScales] = useState<string[]>([]);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandLogo, setNewBrandLogo] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState('');
  const [newCategorySubtitle, setNewCategorySubtitle] = useState('');
  const [newScale, setNewScale] = useState('');
  const [editingBrandName, setEditingBrandName] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);

  // Initialize and prime audio for mobile/laptop background playback
  useEffect(() => {
    const audio = new Audio('/notification.mp3');
    audio.preload = 'auto';
    audioRef.current = audio;

    // Modern mobile & laptop browsers require 1 interaction to unlock sound
    const unlockAudio = () => {
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        setAudioReady(true);
      }).catch(() => {});
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    // Request notification permission if available
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    if (isSoundMuted) return;
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => {
          console.warn('[Audio Play Warning]:', err);
        });
      } else {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {});
      }
      // Vibrate mobile device if supported
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([300, 150, 300]);
      }
    } catch (err) {
      console.error('[Notification Sound Error]', err);
    }
  }, [isSoundMuted]);

  const testNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => {
        setAudioReady(true);
        toast.success('🔔 Notification sound working!', { icon: '🔊' });
      }).catch(err => {
        toast.error('Audio blocked by browser. Please tap anywhere on the page to enable sound.');
        console.warn('Audio test failed:', err);
      });
    } else {
      const audio = new Audio('/notification.mp3');
      audio.play().then(() => {
        setAudioReady(true);
        toast.success('🔔 Notification sound working!', { icon: '🔊' });
      }).catch(() => {
        toast.error('Audio blocked by browser. Please tap anywhere on the page to enable sound.');
      });
    }
  };

  const refreshData = useCallback(async () => {
    try {
      const [prods, brs, cats, scs, nw, ords, offrs, bestSell] = await Promise.all([
        apiGetProducts(),
        apiGetBrands(),
        apiGetCategories(),
        apiGetScales(),
        apiGetNews(),
        apiGetAdminOrders(),
        apiGetAdminOffers(),
        apiGetBestSellingStats(),
      ]);
      setProducts(prods);
      setLocalBrands(brs);
      setLocalCategories(cats);
      setLocalScales(scs);
      setNewsList(nw);
      setOrders(ords);
      setOffers(offrs);
      if (bestSell) setBestSellingData(bestSell);
      if (isInitialOrderLoadRef.current) {
        knownOrderIdsRef.current = new Set(ords.map(o => o.id));
        isInitialOrderLoadRef.current = false;
      }
    } catch (err) {
      console.error('Error refreshing admin data:', err);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Live order detection loop: polls every 4 seconds and responds to instant cross-tab events
  useEffect(() => {
    let isSubscribed = true;

    const pollOrders = async () => {
      try {
        const latestOrders = await apiGetAdminOrders();
        if (!isSubscribed) return;

        if (isInitialOrderLoadRef.current) {
          knownOrderIdsRef.current = new Set(latestOrders.map(o => o.id));
          setOrders(latestOrders);
          isInitialOrderLoadRef.current = false;
          return;
        }

        // Detect any new orders that were not previously known
        const newOrders = latestOrders.filter(o => !knownOrderIdsRef.current.has(o.id));
        if (newOrders.length > 0) {
          latestOrders.forEach(o => knownOrderIdsRef.current.add(o.id));
          setOrders(latestOrders);

          // Play notification sound loud and clear
          playNotificationSound();

          // Display prominent toast notification
          const topOrder = newOrders[0];
          toast.success(
            `🚨 NEW ORDER RECEIVED!\n#${topOrder.id} - ${topOrder.customerName} (₹${topOrder.totalAmount.toLocaleString('en-IN')})`,
            {
              duration: 9000,
              icon: '🔔',
              style: {
                background: '#0f172a',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                border: '2px solid #3b82f6',
                padding: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              },
            }
          );

          // Push native device notification if permitted
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('🚨 New Order Placed on Diecast Hub!', {
              body: `Order #${topOrder.id} (₹${topOrder.totalAmount}) by ${topOrder.customerName}`,
              icon: '/logo.png',
            });
          }
        }
      } catch (err) {
        console.error('Error polling for new orders:', err);
      }
    };

    const intervalId = setInterval(pollOrders, 4000);

    // Cross-tab instant broadcast listener
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'diecasthub_last_order') {
        pollOrders();
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('diecasthub_new_order_placed', pollOrders);

    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('diecasthub_new_order_placed', pollOrders);
    };
  }, [playNotificationSound]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status'], trackingId?: string) => {
    const ok = await apiUpdateOrderStatus(orderId, newStatus, trackingId);
    if (ok) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, trackingId: trackingId !== undefined ? trackingId : o.trackingId } : o));
      toast.success(`Order updated`);
    } else {
      toast.error('Failed to update order');
    }
  };

  // --- Offer Handlers ---
  const handleAddOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const purchaseAmt = Number(newOfferPurchaseAmount);
    const discPct = Number(newOfferPercentage);

    if (isNaN(purchaseAmt) || purchaseAmt <= 0) {
      toast.error('Please enter a valid purchase amount greater than 0');
      return;
    }
    if (isNaN(discPct) || discPct < 1 || discPct > 100) {
      toast.error('Offer percentage must be between 1% and 100%');
      return;
    }

    setIsSavingOffer(true);
    try {
      const created = await apiSaveOffer({
        minPurchaseAmount: purchaseAmt,
        discountPercentage: discPct,
      });
      if (created) {
        setOffers(prev => [created, ...prev]);
        toast.success(`🎉 Offer added: ${discPct}% OFF on orders ₹${purchaseAmt.toLocaleString('en-IN')}+`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add offer';
      toast.error(msg);
    } finally {
      setIsSavingOffer(false);
    }
  };

  const handleToggleOfferStatus = async (offerId: string, currentStatus: boolean) => {
    const ok = await apiToggleOffer(offerId, !currentStatus);
    if (ok) {
      setOffers(prev => prev.map(o => o.id === offerId ? { ...o, isActive: !currentStatus } : o));
      toast.success(`Offer marked as ${!currentStatus ? 'Active' : 'Inactive'}`);
    } else {
      toast.error('Failed to update offer status');
    }
  };

  const handleDeleteOfferItem = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    const ok = await apiDeleteOffer(offerId);
    if (ok) {
      setOffers(prev => prev.filter(o => o.id !== offerId));
      toast.success('Offer deleted');
    } else {
      toast.error('Failed to delete offer');
    }
  };

  // --- Best Selling Handlers ---
  const handleToggleBestsellerTag = async (productId: string, currentStatus: boolean) => {
    try {
      const prod = products.find(p => p.id === productId || p.slug === productId);
      if (!prod) return;
      const updated = await apiSaveProduct({
        ...prod,
        isBestseller: !currentStatus,
        badge: !currentStatus ? 'bestseller' : '',
        badgeTag: !currentStatus ? 'BESTSELLER' : '',
      });
      if (updated) {
        setProducts(prev => prev.map(p => (p.id === productId || p.slug === productId) ? updated : p));
        setBestSellingData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map(item => item.productId === productId ? { ...item, isBestseller: !currentStatus } : item),
          };
        });
        toast.success(!currentStatus ? `Marked "${prod.name}" as Storefront Bestseller!` : `Removed Bestseller tag from "${prod.name}"`);
      }
    } catch (err) {
      toast.error('Failed to update product');
    }
  };

  // --- Product Handlers ---
  const handleEditProduct = (product: Product) => setEditingProduct({ ...product });
  
  const handleAddProduct = () => {
    setEditingProduct({
      id: Date.now().toString(),
      name: '',
      slug: `product-${Date.now()}`,
      brand: localBrands.length > 0 ? localBrands[0].name : '',
      scale: localScales.length > 0 ? localScales[0] : '',
      category: localCategories.length > 0 ? localCategories[0].name : '',
      price: 0,
      stock: 0,
      rating: 0,
      reviews: 0,
      model: '',
      image: '',
      gallery: [],
      badgeTag: '',
      badge: '',
      isPreorder: false,
      releaseDate: '',
      preorderAmount: 0,
      colors: [],
      colorImages: []
    });
  };

  const handleCancelEditProduct = () => setEditingProduct(null);
  
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const toastId = toast.loading('Saving product to database...');
    try {
      const saved = await apiSaveProduct(editingProduct);
      if (saved) {
        setProducts(prev => {
          const idx = prev.findIndex(p => p.id === saved.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [saved, ...prev];
        });
        toast.success('Product saved to database!', { id: toastId });
        setEditingProduct(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save product';
      toast.error(msg, { id: toastId });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    const toastId = toast.loading('Deleting product...');
    const prevProducts = [...products];
    // Optimistic deletion for instantaneous UI response
    setProducts(prev => prev.filter(p => p.id !== id && (p as unknown as { _id?: string })._id !== id));
    if (editingProduct?.id === id || (editingProduct as unknown as { _id?: string })?._id === id) {
      setEditingProduct(null);
    }
    try {
      const ok = await apiDeleteProduct(id);
      if (ok) {
        toast.success('Product deleted from database', { id: toastId });
      } else {
        setProducts(prevProducts);
        toast.error('Failed to delete product', { id: toastId });
      }
    } catch (err) {
      setProducts(prevProducts);
      toast.error('Error deleting product', { id: toastId });
    }
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        [name]: name === 'colors' ? value.split(',').map(c => c.trim()).filter(c => c !== '') : (name === 'price' || name === 'stock' || name === 'preorderAmount' ? Number(value) : value)
      });
    }
  };

  const handleBadgeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!editingProduct) return;
    if (value === 'Coming Soon') {
      setEditingProduct({
        ...editingProduct,
        badgeTag: 'Coming Soon',
        badge: 'coming-soon',
        isPreorder: true,
        isNew: false,
        isBestseller: false
      });
    } else if (value === 'NEW') {
      setEditingProduct({
        ...editingProduct,
        badgeTag: 'NEW',
        badge: 'new',
        isPreorder: false,
        isNew: true,
        isBestseller: false
      });
    } else if (value === 'BESTSELLER') {
      setEditingProduct({
        ...editingProduct,
        badgeTag: 'BESTSELLER',
        badge: 'bestseller',
        isPreorder: false,
        isNew: false,
        isBestseller: true
      });
    } else {
      setEditingProduct({
        ...editingProduct,
        badgeTag: '',
        badge: '',
        isPreorder: false,
        isNew: false,
        isBestseller: false
      });
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (!editingProduct || !editingProduct.gallery) return;
    
    const newGallery = editingProduct.gallery.filter((_, idx) => idx !== indexToRemove);
    setEditingProduct({
      ...editingProduct,
      gallery: newGallery,
      image: newGallery.length > 0 ? newGallery[0] : ''
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !editingProduct) return;
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploadingImage(true);
    const toastId = toast.loading(`Uploading ${files.length} image(s) to Cloudinary...`);
    try {
      const uploadPromises = files.map(file => apiUploadImage(file, 'diecast/products'));
      const uploadedUrls = await Promise.all(uploadPromises);

      const currentGallery = editingProduct.gallery || [];
      const newGallery = [...currentGallery, ...uploadedUrls];

      setEditingProduct({
        ...editingProduct,
        image: editingProduct.image ? editingProduct.image : uploadedUrls[0],
        gallery: newGallery,
      });
      toast.success('Images uploaded to Cloudinary successfully!', { id: toastId });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(msg, { id: toastId });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // --- News Handlers ---
  const handleEditNews = (item: NewsItem) => setEditingNews({ ...item });
  const handleAddNews = () => {
    setEditingNews({
      id: Date.now().toString(),
      text: ''
    });
  };
  const handleCancelEditNews = () => setEditingNews(null);

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNews || !editingNews.text.trim()) return;
    const toastId = toast.loading('Saving announcement...');
    try {
      const saved = await apiSaveNews(editingNews);
      if (saved) {
        setNewsList(prev => {
          const idx = prev.findIndex(n => n.id === saved.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [saved, ...prev];
        });
        toast.success('Announcement saved!', { id: toastId });
        setEditingNews(null);
      }
    } catch (err) {
      toast.error('Failed to save announcement', { id: toastId });
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    const toastId = toast.loading('Deleting announcement...');
    const prevNews = [...newsList];
    setNewsList(prev => prev.filter(n => n.id !== id));
    try {
      const ok = await apiDeleteNews(id);
      if (ok) {
        toast.success('Announcement deleted', { id: toastId });
      } else {
        setNewsList(prevNews);
        toast.error('Failed to delete announcement', { id: toastId });
      }
    } catch (err) {
      setNewsList(prevNews);
      toast.error('Error deleting announcement', { id: toastId });
    }
  };

  const handleNewsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editingNews) {
      setEditingNews({ ...editingNews, [name]: value });
    }
  };

  // --- Metadata Handlers ---
  const handleBrandLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const toastId = toast.loading('Uploading brand logo to Cloudinary...');
    try {
      const url = await apiUploadImage(file, 'diecast/brands');
      setNewBrandLogo(url);
      toast.success('Brand logo uploaded!', { id: toastId });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(msg, { id: toastId });
    }
  };

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const toastId = toast.loading('Uploading category image to Cloudinary...');
    try {
      const url = await apiUploadImage(file, 'diecast/categories');
      setNewCategoryImage(url);
      toast.success('Category image uploaded!', { id: toastId });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(msg, { id: toastId });
    }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newBrandName.trim() && !localBrands.some(b => b.name.toLowerCase() === newBrandName.trim().toLowerCase())) {
      const toastId = toast.loading('Adding brand to database...');
      try {
        const saved = await apiSaveBrand({ name: newBrandName.trim(), logo: newBrandLogo });
        if (saved) {
          setLocalBrands(prev => [...prev, saved]);
          setNewBrandName('');
          setNewBrandLogo('');
          toast.success('Brand added successfully!', { id: toastId });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to add brand';
        toast.error(msg, { id: toastId });
      }
    }
  };

  const handleEditBrandClick = (brand: Brand) => {
    setEditingBrandName(brand.name);
    setNewBrandName(brand.name);
    setNewBrandLogo(brand.logo || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelBrandEdit = () => {
    setEditingBrandName(null);
    setNewBrandName('');
    setNewBrandLogo('');
  };

  const handleUpdateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrandName) return;
    
    const trimmedName = newBrandName.trim();
    if (trimmedName) {
      const toastId = toast.loading('Updating brand...');
      try {
        const saved = await apiSaveBrand({ name: trimmedName, logo: newBrandLogo });
        if (saved) {
          setLocalBrands(prev => prev.map(b => b.name === editingBrandName ? saved : b));
          if (trimmedName !== editingBrandName) {
            setProducts(prev => prev.map(p => p.brand === editingBrandName ? { ...p, brand: trimmedName } : p));
          }
          handleCancelBrandEdit();
          toast.success('Brand updated!', { id: toastId });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update brand';
        toast.error(msg, { id: toastId });
      }
    }
  };

  const handleDeleteBrand = async (brandName: string) => {
    if (!window.confirm(`Are you sure you want to delete the brand "${brandName}"?`)) return;
    const toastId = toast.loading('Deleting brand...');
    const prevBrands = [...localBrands];
    setLocalBrands(prev => prev.filter(b => b.name !== brandName));
    try {
      const ok = await apiDeleteBrand(brandName);
      if (ok) {
        toast.success('Brand deleted', { id: toastId });
      } else {
        setLocalBrands(prevBrands);
        toast.error('Failed to delete brand', { id: toastId });
      }
    } catch (err) {
      setLocalBrands(prevBrands);
      toast.error('Error deleting brand', { id: toastId });
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim() && !localCategories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      const toastId = toast.loading('Adding category to database...');
      try {
        const saved = await apiSaveCategory({
          name: newCategoryName.trim(),
          image: newCategoryImage,
          subtitle: newCategorySubtitle,
        });
        if (saved) {
          setLocalCategories(prev => [...prev, saved]);
          setNewCategoryName('');
          setNewCategoryImage('');
          setNewCategorySubtitle('');
          toast.success('Category added successfully!', { id: toastId });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to add category';
        toast.error(msg, { id: toastId });
      }
    }
  };

  const handleEditCategoryClick = (category: Category) => {
    setEditingCategoryName(category.name);
    setNewCategoryName(category.name);
    setNewCategoryImage(category.image || '');
    setNewCategorySubtitle(category.subtitle || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategoryName(null);
    setNewCategoryName('');
    setNewCategoryImage('');
    setNewCategorySubtitle('');
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategoryName) return;
    
    const trimmedName = newCategoryName.trim();
    if (trimmedName) {
      const toastId = toast.loading('Updating category...');
      try {
        const saved = await apiSaveCategory({
          name: trimmedName,
          image: newCategoryImage,
          subtitle: newCategorySubtitle,
        });
        if (saved) {
          setLocalCategories(prev => prev.map(c => c.name === editingCategoryName ? saved : c));
          handleCancelCategoryEdit();
          toast.success('Category updated!', { id: toastId });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update category';
        toast.error(msg, { id: toastId });
      }
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (!window.confirm(`Are you sure you want to delete the category "${categoryName}"?`)) return;
    const toastId = toast.loading('Deleting category...');
    const prevCategories = [...localCategories];
    setLocalCategories(prev => prev.filter(c => c.name !== categoryName));
    try {
      const ok = await apiDeleteCategory(categoryName);
      if (ok) {
        toast.success('Category deleted', { id: toastId });
      } else {
        setLocalCategories(prevCategories);
        toast.error('Failed to delete category', { id: toastId });
      }
    } catch (err) {
      setLocalCategories(prevCategories);
      toast.error('Error deleting category', { id: toastId });
    }
  };

  const handleAddScale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newScale.trim() && !localScales.includes(newScale.trim())) {
      const toastId = toast.loading('Adding scale...');
      try {
        const saved = await apiAddScale(newScale.trim());
        if (saved) {
          setLocalScales(prev => [...prev, saved]);
          setNewScale('');
          toast.success('Scale added!', { id: toastId });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to add scale';
        toast.error(msg, { id: toastId });
      }
    }
  };

  const handleDeleteScale = async (scale: string) => {
    if (!window.confirm(`Are you sure you want to delete the scale "${scale}"?`)) return;
    const toastId = toast.loading('Deleting scale...');
    const prevScales = [...localScales];
    setLocalScales(prev => prev.filter(s => s !== scale));
    try {
      const ok = await apiDeleteScale(scale);
      if (ok) {
        toast.success('Scale deleted', { id: toastId });
      } else {
        setLocalScales(prevScales);
        toast.error('Failed to delete scale', { id: toastId });
      }
    } catch (err) {
      setLocalScales(prevScales);
      toast.error('Error deleting scale', { id: toastId });
    }
  };

  if (isAuthenticated === null) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        Checking administrator privileges...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <div className={styles.soundAlertControls}>
            <span className={styles.orderLivePill}>
              <span className={styles.pulseDot}></span>
              Live Alerts
            </span>
            <button 
              type="button" 
              className={styles.btnSoundTest} 
              onClick={testNotificationSound}
              title="Test notification sound and unlock audio"
            >
              🔔 Test Sound
            </button>
            <button 
              type="button" 
              className={`${styles.btnSoundToggle} ${isSoundMuted ? styles.btnSoundMuted : ''}`} 
              onClick={() => {
                const nextState = !isSoundMuted;
                setIsSoundMuted(nextState);
                toast(nextState ? '🔇 Order sound muted' : '🔊 Order sound unmuted');
              }}
              title={isSoundMuted ? "Sound muted. Click to enable" : "Sound active. Click to mute"}
            >
              {isSoundMuted ? '🔇 Sound: OFF' : '🔊 Sound: ON'}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {activeTab === 'inventory' && (
            <button className={styles.btnAdd} onClick={handleAddProduct}>+ Add Product</button>
          )}
          {activeTab === 'news' && (
            <button className={styles.btnAdd} onClick={handleAddNews}>+ Add News</button>
          )}
          <button 
            type="button" 
            onClick={handleLogout}
            style={{
              padding: '8px 14px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title="Log out of Admin Dashboard"
          >
            🔒 Log Out
          </button>
        </div>
      </div>

      <div className={styles.tabsWrapper}>
        {/* Mobile Dropdown Button */}
        <div className={styles.mobileTabWrapper}>
          <button 
            className={styles.mobileTabButton} 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {activeTab === 'inventory' && 'Inventory'}
            {activeTab === 'orders' && 'Orders'}
            {activeTab === 'brand' && 'Brand'}
            {activeTab === 'category' && 'Category'}
            {activeTab === 'scale' && 'Scale'}
            {activeTab === 'news' && 'News'}
            {activeTab === 'notifications' && 'Notifications'}
            {activeTab === 'bestselling' && 'Best selling'}
            {activeTab === 'offer' && 'Offer'}
            <span className={styles.dropdownIcon}>{isMobileMenuOpen ? '▲' : '▼'}</span>
          </button>
          
          {isMobileMenuOpen && (
            <div className={styles.mobileDropdown}>
              <button className={`${styles.dropdownItem} ${activeTab === 'inventory' ? styles.dropdownItemActive : ''}`} onClick={() => { setActiveTab('inventory'); setIsMobileMenuOpen(false); setEditingNews(null); }}>Inventory</button>
              <button className={`${styles.dropdownItem} ${activeTab === 'orders' ? styles.dropdownItemActive : ''}`} onClick={() => { setActiveTab('orders'); setIsMobileMenuOpen(false); setEditingProduct(null); setEditingNews(null); }}>Orders</button>
              <button className={`${styles.dropdownItem} ${activeTab === 'brand' ? styles.dropdownItemActive : ''}`} onClick={() => { setActiveTab('brand'); setIsMobileMenuOpen(false); setEditingProduct(null); setEditingNews(null); }}>Brand</button>
              <button className={`${styles.dropdownItem} ${activeTab === 'category' ? styles.dropdownItemActive : ''}`} onClick={() => { setActiveTab('category'); setIsMobileMenuOpen(false); setEditingProduct(null); setEditingNews(null); }}>Category</button>
              <button className={`${styles.dropdownItem} ${activeTab === 'scale' ? styles.dropdownItemActive : ''}`} onClick={() => { setActiveTab('scale'); setIsMobileMenuOpen(false); setEditingProduct(null); setEditingNews(null); }}>Scale</button>
              <button className={`${styles.dropdownItem} ${activeTab === 'news' ? styles.dropdownItemActive : ''}`} onClick={() => { setActiveTab('news'); setIsMobileMenuOpen(false); setEditingProduct(null); }}>News</button>
              <button className={`${styles.dropdownItem} ${activeTab === 'notifications' ? styles.dropdownItemActive : ''}`} onClick={() => { setActiveTab('notifications'); setIsMobileMenuOpen(false); setEditingProduct(null); setEditingNews(null); }}>Notifications</button>
              <button className={`${styles.dropdownItem} ${activeTab === 'bestselling' ? styles.dropdownItemActive : ''}`} onClick={() => { setActiveTab('bestselling'); setIsMobileMenuOpen(false); setEditingProduct(null); setEditingNews(null); }}>Best selling</button>
              <button className={`${styles.dropdownItem} ${activeTab === 'offer' ? styles.dropdownItemActive : ''}`} onClick={() => { setActiveTab('offer'); setIsMobileMenuOpen(false); setEditingProduct(null); setEditingNews(null); }}>Offer</button>
            </div>
          )}
        </div>

        {/* Desktop Tabs */}
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'inventory' ? styles.tabActive : ''}`}
            onClick={() => { setActiveTab('inventory'); setEditingNews(null); }}
          >
            Inventory
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'orders' ? styles.tabActive : ''}`}
            onClick={() => { setActiveTab('orders'); setEditingProduct(null); setEditingNews(null); }}
          >
            Orders
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'brand' ? styles.tabActive : ''}`}
            onClick={() => { setActiveTab('brand'); setEditingProduct(null); setEditingNews(null); }}
          >
            Brand
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'category' ? styles.tabActive : ''}`}
            onClick={() => { setActiveTab('category'); setEditingProduct(null); setEditingNews(null); }}
          >
            Category
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'scale' ? styles.tabActive : ''}`}
            onClick={() => { setActiveTab('scale'); setEditingProduct(null); setEditingNews(null); }}
          >
            Scale
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'news' ? styles.tabActive : ''}`}
            onClick={() => { setActiveTab('news'); setEditingProduct(null); }}
          >
            News
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'notifications' ? styles.tabActive : ''}`}
            onClick={() => { setActiveTab('notifications'); setEditingProduct(null); setEditingNews(null); }}
          >
            Notifications
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'bestselling' ? styles.tabActive : ''}`}
            onClick={() => { setActiveTab('bestselling'); setEditingProduct(null); setEditingNews(null); }}
          >
            Best selling
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'offer' ? styles.tabActive : ''}`}
            onClick={() => { setActiveTab('offer'); setEditingProduct(null); setEditingNews(null); }}
          >
            Offer
          </button>
        </div>
      </div>

      {activeTab === 'inventory' && (
        <div className={`${styles.main} ${editingProduct ? styles.mainEditing : ''}`}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Brand</th>
                  <th>Scale</th>
                  <th>Price (₹)</th>
                  <th>Stock</th>
                  <th>Tag / Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, idx) => (
                  <tr key={`adm-p-${product.id || idx}`}>
                    <td style={{ fontWeight: 500 }}>{product.name}</td>
                    <td>{product.brand}</td>
                    <td>{product.scale}</td>
                    <td>{product.price.toLocaleString('en-IN')}</td>
                    <td>
                      <span style={{ color: product.stock > 0 ? '#27ae60' : '#e74c3c', fontWeight: 600 }}>
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      {isPreorderProduct(product) ? (
                        <span style={{ backgroundColor: '#ffedd5', color: '#c2410c', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, display: 'inline-block' }}>
                          Pre-Order ({product.badgeTag || 'Coming Soon'})
                        </span>
                      ) : product.isNew ? (
                        <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, display: 'inline-block' }}>
                          New
                        </span>
                      ) : product.isBestseller ? (
                        <span style={{ backgroundColor: '#f3e8ff', color: '#7e22ce', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, display: 'inline-block' }}>
                          Bestseller
                        </span>
                      ) : (
                        <span style={{ color: '#999', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button className={styles.btnEdit} onClick={() => handleEditProduct(product)}>
                          Edit
                        </button>
                        <button className={styles.btnEdit} onClick={() => handleDeleteProduct(product.id)} style={{ backgroundColor: '#e74c3c', color: 'white' }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {editingProduct && (
            <div className={styles.modalOverlay}>
              <div className={styles.formContainer}>
              <div className={styles.formTitle}>
                <span>{products.find(p => p.id === editingProduct.id) ? 'Edit Product' : 'Add Product'}</span>
                <button className={styles.btnClose} onClick={handleCancelEditProduct}>×</button>
              </div>
              
              <form onSubmit={handleSaveProduct}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Product Images (Upload Multiple)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className={styles.input} 
                    onChange={handleImageUpload} 
                    style={{ padding: '8px' }}
                    disabled={isUploadingImage}
                  />
                  {isUploadingImage && (
                    <div style={{ color: '#0070f3', fontSize: '13px', marginTop: '6px', fontWeight: 500 }}>
                      ⏳ Uploading images to Cloudinary... Please wait.
                    </div>
                  )}
                  <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                    {editingProduct.gallery?.length || 0} image(s) currently attached. First image will be used as the thumbnail.
                  </small>
                  {editingProduct.gallery && editingProduct.gallery.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                      {editingProduct.gallery.map((imgSrc, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '60px', height: '60px' }}>
                          <img 
                            src={imgSrc} 
                            alt={`Preview ${idx}`} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} 
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            style={{
                              position: 'absolute',
                              top: '-6px',
                              right: '-6px',
                              background: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              lineHeight: '1'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Product Name</label>
                  <input type="text" name="name" className={styles.input} value={editingProduct.name} onChange={handleProductChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Available Colors (Comma Separated) - Simple</label>
                  <input type="text" name="colors" placeholder="e.g. Red, Blue, Matte Black" className={styles.input} value={editingProduct.colors?.join(', ') || ''} onChange={handleProductChange} />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Color Images Mapping (Advanced)</label>
                  {editingProduct.colorImages?.map((ci, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder="Color Name (e.g. Red)" 
                        className={styles.input} 
                        value={ci.color}
                        onChange={(e) => {
                          const newColorImages = [...(editingProduct.colorImages || [])];
                          newColorImages[idx].color = e.target.value;
                          setEditingProduct({ ...editingProduct, colorImages: newColorImages });
                        }}
                      />
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple
                        className={styles.input}
                        onChange={async (e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const files = Array.from(e.target.files);
                            const toastId = toast.loading(`Uploading ${files.length} images...`);
                            try {
                              const uploadPromises = files.map(file => apiUploadImage(file, 'diecast/products'));
                              const urls = await Promise.all(uploadPromises);
                              const newColorImages = [...(editingProduct.colorImages || [])];
                              newColorImages[idx].images = [...(newColorImages[idx].images || []), ...urls];
                              setEditingProduct({ ...editingProduct, colorImages: newColorImages });
                              toast.success('Color images uploaded!', { id: toastId });
                            } catch (err) {
                              toast.error('Failed to upload color images', { id: toastId });
                            }
                          }
                        }}
                      />
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {ci.images?.map((imgUrl, imgIdx) => (
                          <div key={imgIdx} style={{ position: 'relative', width: '40px', height: '40px' }}>
                            <img src={imgUrl} alt={`${ci.color} ${imgIdx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                            <button
                              type="button"
                              onClick={() => {
                                const newColorImages = [...(editingProduct.colorImages || [])];
                                newColorImages[idx].images = newColorImages[idx].images.filter((_, i) => i !== imgIdx);
                                setEditingProduct({ ...editingProduct, colorImages: newColorImages });
                              }}
                              style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          const newColorImages = editingProduct.colorImages?.filter((_, i) => i !== idx);
                          setEditingProduct({ ...editingProduct, colorImages: newColorImages });
                        }}
                        style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => {
                      const newColorImages = [...(editingProduct.colorImages || []), { color: '', images: [] }];
                      setEditingProduct({ ...editingProduct, colorImages: newColorImages });
                    }}
                    className={styles.btnAdd}
                    style={{ marginTop: '8px' }}
                  >
                    + Add Color Image Mapping
                  </button>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Badge / Tag (Section Routing)</label>
                  <select 
                    name="badge" 
                    className={styles.select} 
                    value={
                      isPreorderProduct(editingProduct) 
                        ? 'Coming Soon' 
                        : editingProduct.isNew 
                        ? 'NEW' 
                        : editingProduct.isBestseller 
                        ? 'BESTSELLER' 
                        : ''
                    } 
                    onChange={handleBadgeChange}
                  >
                    <option value="">None (Regular Product)</option>
                    <option value="Coming Soon">Coming Soon (Routes to Pre-Orders section)</option>
                    <option value="NEW">New Arrival</option>
                    <option value="BESTSELLER">Bestseller</option>
                  </select>
                </div>
                {isPreorderProduct(editingProduct) && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Expected Release / Arrival Date (Optional)</label>
                      <input 
                        type="text" 
                        name="releaseDate" 
                        placeholder="e.g. Expected Nov 2026" 
                        className={styles.input} 
                        value={editingProduct.releaseDate || ''} 
                        onChange={handleProductChange} 
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Preorder Reservation Amount (₹)</label>
                      <input 
                        type="number" 
                        name="preorderAmount" 
                        className={styles.input} 
                        value={editingProduct.preorderAmount || 0} 
                        onChange={handleProductChange} 
                      />
                    </div>
                  </>
                )}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Brand</label>
                  <select name="brand" className={styles.select} value={editingProduct.brand} onChange={handleProductChange}>
                    {localBrands.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Scale</label>
                  <select name="scale" className={styles.select} value={editingProduct.scale} onChange={handleProductChange}>
                    {localScales.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Category</label>
                  <select name="category" className={styles.select} value={editingProduct.category} onChange={handleProductChange}>
                    {localCategories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Price (₹)</label>
                  <input type="number" name="price" className={styles.input} value={editingProduct.price} onChange={handleProductChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Stock Quantity</label>
                  <input type="number" name="stock" className={styles.input} value={editingProduct.stock} onChange={handleProductChange} required />
                </div>
                <button type="submit" className={styles.btnSave}>Save Changes</button>
              </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'news' && (
        <div className={`${styles.main} ${editingNews ? styles.mainEditing : ''}`}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Announcement Text</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {newsList.map((item, idx) => (
                  <tr key={`adm-n-${item.id || idx}`}>
                    <td style={{ fontWeight: 500 }}>{item.text}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button className={styles.btnEdit} onClick={() => handleEditNews(item)}>Edit</button>
                        <button className={styles.btnEdit} onClick={() => handleDeleteNews(item.id)} style={{ backgroundColor: '#e74c3c' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {newsList.length === 0 && (
                  <tr>
                    <td colSpan={2} style={{ textAlign: 'center', padding: '24px' }}>No announcements found. Add one!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {editingNews && (
            <div className={styles.modalOverlay}>
              <div className={styles.formContainer}>
              <div className={styles.formTitle}>
                <span>{newsList.find(n => n.id === editingNews.id) ? 'Edit Announcement' : 'Add Announcement'}</span>
                <button className={styles.btnClose} onClick={handleCancelEditNews}>×</button>
              </div>
              
              <form onSubmit={handleSaveNews}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Announcement Text</label>
                  <input type="text" name="text" className={styles.input} value={editingNews.text} onChange={handleNewsChange} required />
                </div>
                <button type="submit" className={styles.btnSave}>Save Announcement</button>
              </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'brand' && (
        <div className={styles.main}>
          <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%', backgroundColor: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <h2 className={styles.title} style={{ fontSize: '20px', marginBottom: '16px' }}>{editingBrandName ? 'Edit Brand' : 'Manage Brands'}</h2>
            <form onSubmit={editingBrandName ? handleUpdateBrand : handleAddBrand} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <input 
                type="text" 
                className={styles.input} 
                placeholder="Brand Name" 
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                required
              />
              <input 
                type="file" 
                accept="image/*"
                className={styles.input}
                onChange={handleBrandLogoUpload}
              />
              {newBrandLogo && (
                <div style={{ position: 'relative', display: 'inline-block', alignSelf: 'flex-start' }}>
                  <img src={newBrandLogo} alt="Logo preview" style={{ height: '40px', objectFit: 'contain' }} />
                  <button
                    type="button"
                    onClick={() => setNewBrandLogo('')}
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      lineHeight: '1',
                      padding: 0
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start' }}>
                <button type="submit" className={styles.btnAdd}>{editingBrandName ? 'Update Brand' : 'Add Brand'}</button>
                {editingBrandName && (
                  <button type="button" className={styles.btnEdit} onClick={handleCancelBrandEdit}>Cancel</button>
                )}
              </div>
            </form>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Logo</th>
                  <th>Brand Name</th>
                  <th style={{ width: '80px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {localBrands.map((b, idx) => (
                  <tr key={`adm-b-${b.name || idx}`}>
                    <td>
                      {b.logo ? (
                        <img src={b.logo} alt={b.name} style={{ height: '30px', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ color: '#999', fontSize: '12px' }}>No Logo</span>
                      )}
                    </td>
                    <td>{b.name}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button className={styles.btnEdit} onClick={() => handleEditBrandClick(b)}>Edit</button>
                        <button className={styles.btnEdit} onClick={() => handleDeleteBrand(b.name)} style={{ backgroundColor: '#e74c3c' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'category' && (
        <div className={styles.main}>
          <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%', backgroundColor: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <h2 className={styles.title} style={{ fontSize: '20px', marginBottom: '16px' }}>{editingCategoryName ? 'Edit Category' : 'Manage Categories'}</h2>
            <form onSubmit={editingCategoryName ? handleUpdateCategory : handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <input 
                type="text" 
                className={styles.input} 
                placeholder="Category Name" 
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
              />
              <input 
                type="text" 
                className={styles.input} 
                placeholder="Category Subtitle (e.g. CHOOSE YOUR DISCIPLINE)" 
                value={newCategorySubtitle}
                onChange={(e) => setNewCategorySubtitle(e.target.value)}
              />
              <input 
                type="file" 
                accept="image/*"
                className={styles.input}
                onChange={handleCategoryImageUpload}
              />
              {newCategoryImage && (
                <div style={{ position: 'relative', display: 'inline-block', alignSelf: 'flex-start' }}>
                  <img src={newCategoryImage} alt="Image preview" style={{ height: '40px', objectFit: 'contain' }} />
                  <button
                    type="button"
                    onClick={() => setNewCategoryImage('')}
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      lineHeight: '1',
                      padding: 0
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start' }}>
                <button type="submit" className={styles.btnAdd}>{editingCategoryName ? 'Update Category' : 'Add Category'}</button>
                {editingCategoryName && (
                  <button type="button" className={styles.btnEdit} onClick={handleCancelCategoryEdit}>Cancel</button>
                )}
              </div>
            </form>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Category Name</th>
                  <th style={{ width: '80px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {localCategories.map((c, idx) => (
                  <tr key={`adm-c-${c.name || idx}`}>
                    <td>
                      {c.image ? (
                        <TransparentCategoryImg src={c.image} alt={c.name} style={{ height: '30px', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ color: '#999', fontSize: '12px' }}>No Image</span>
                      )}
                    </td>
                    <td>{c.name}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button className={styles.btnEdit} onClick={() => handleEditCategoryClick(c)}>Edit</button>
                        <button className={styles.btnEdit} onClick={() => handleDeleteCategory(c.name)} style={{ backgroundColor: '#e74c3c' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'scale' && (
        <div className={styles.main}>
          <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%', backgroundColor: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <h2 className={styles.title} style={{ fontSize: '20px', marginBottom: '16px' }}>Manage Scales</h2>
            <form onSubmit={handleAddScale} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input 
                type="text" 
                className={styles.input} 
                placeholder="New Scale (e.g. 1:12)" 
                value={newScale}
                onChange={(e) => setNewScale(e.target.value)}
                required
              />
              <button type="submit" className={styles.btnAdd}>Add</button>
            </form>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Scale Name</th>
                  <th style={{ width: '80px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {localScales.map((s, idx) => (
                  <tr key={`adm-s-${s || idx}`}>
                    <td>{s}</td>
                    <td>
                      <button className={styles.btnEdit} onClick={() => handleDeleteScale(s)} style={{ backgroundColor: '#e74c3c' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className={styles.main}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order ID / Date</th>
                  <th>Customer Details</th>
                  <th>Product Details</th>
                  <th>Color</th>
                  <th>Amount (₹)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => (
                  <tr key={`adm-o-${order.id || idx}`}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.id}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{new Date(order.date).toLocaleString()}</div>
                      {order.trackingId && (
                        <div style={{ fontSize: '11px', color: '#16a34a', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '4px', fontWeight: 600 }}>
                          Track: {order.trackingId}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{order.customerName}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{order.customerPhone}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{order.city}, {order.state}</div>
                      {order.shippingPartner && (
                        <div style={{ fontSize: '11px', color: '#0369a1', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '4px', fontWeight: 600 }}>
                          🚚 {order.shippingPartner.split(' (')[0]}
                        </div>
                      )}
                    </td>
                    <td>
                      {order.items && order.items.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src={order.items[0].image} alt={order.items[0].name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                          <div style={{ fontSize: '13px', maxWidth: '200px' }}>
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={order.items[0].name}>
                              {order.items[0].name} (x{order.items[0].quantity})
                            </div>
                            {order.items.length > 1 && (
                              <div style={{ fontSize: '11px', color: '#666', fontWeight: 600 }}>
                                + {order.items.length - 1} more item{order.items.length - 1 > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : order.product ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src={order.product.image} alt={order.product.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                          <div style={{ fontSize: '13px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={order.product.name}>
                            {order.product.name}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#999' }}>No items</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, i) => (
                            <span key={i} style={{ 
                              fontSize: '12px', 
                              fontWeight: 600,
                              backgroundColor: item.color ? '#eff6ff' : '#f9fafb', 
                              color: item.color ? '#1d4ed8' : '#6b7280',
                              padding: '3px 8px', 
                              borderRadius: '6px',
                              border: item.color ? '1px solid #bfdbfe' : '1px solid #e5e7eb',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              width: 'fit-content'
                            }}>
                              {item.color ? (
                                <>
                                  <span style={{ 
                                    width: '10px', 
                                    height: '10px', 
                                    borderRadius: '50%', 
                                    backgroundColor: item.color.toLowerCase(), 
                                    border: '1px solid rgba(0,0,0,0.25)',
                                    display: 'inline-block',
                                    flexShrink: 0
                                  }} />
                                  {item.color}
                                </>
                              ) : (
                                <span style={{ color: '#9ca3af', fontStyle: 'italic', fontWeight: 400 }}>Standard</span>
                              )}
                              {order.items!.length > 1 ? ` (x${item.quantity})` : ''}
                            </span>
                          ))
                        ) : order.product ? (
                          <span style={{ fontSize: '12px', fontWeight: 500 }}>
                            {(order.product as any).color || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Standard</span>}
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#999' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <div>₹{order.totalAmount.toLocaleString('en-IN')}</div>
                      <div style={{
                        fontSize: '11px',
                        color: order.paymentStatus === 'Failed' ? '#dc2626' : '#059669',
                        backgroundColor: order.paymentStatus === 'Failed' ? '#fef2f2' : '#ecfdf5',
                        border: `1px solid ${order.paymentStatus === 'Failed' ? '#fecaca' : '#a7f3d0'}`,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        display: 'inline-block',
                        marginTop: '4px',
                        fontWeight: 600
                      }}>
                        {order.paymentStatus === 'Failed' ? 'Payment Failed' : '✓ Paid (Razorpay)'}
                      </div>
                      {order.razorpayPaymentId && (
                        <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }} title={order.razorpayPaymentId}>
                          {order.razorpayPaymentId}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                        backgroundColor: order.status === 'Pending' ? '#fef3c7' : order.status === 'Shipped' ? '#e0f2fe' : order.status === 'Delivered' ? '#dcfce7' : '#fee2e2',
                        color: order.status === 'Pending' ? '#d97706' : order.status === 'Shipped' ? '#0284c7' : order.status === 'Delivered' ? '#166534' : '#991b1b'
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <select 
                          className={styles.select} 
                          style={{ padding: '4px', fontSize: '12px', width: 'auto' }}
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as Order['status'], order.trackingId)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <input 
                          type="text"
                          className={styles.input}
                          style={{ padding: '4px', fontSize: '12px', width: '100%', minWidth: '120px' }}
                          placeholder="Tracking ID"
                          value={order.trackingId || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOrders(prev => prev.map(o => o.id === order.id ? { ...o, trackingId: val } : o));
                          }}
                          onBlur={(e) => {
                            handleUpdateOrderStatus(order.id, order.status, e.target.value);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>No orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className={styles.main}>
          <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', backgroundColor: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <h2 className={styles.title} style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#e74c3c' }}>⚠️</span> Low Stock Alerts
            </h2>
            {products.filter(p => p.stock <= 3).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {products.filter(p => p.stock <= 3).map((p, idx) => (
                  <div key={`adm-ls-${p.id || idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={p.image} alt={p.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} />
                      <div>
                        <div style={{ fontWeight: 600, color: '#991b1b' }}>{p.name}</div>
                        <div style={{ fontSize: '12px', color: '#b91c1c' }}>SKU / ID: {p.id}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: p.stock === 0 ? '#7f1d1d' : '#b91c1c' }}>
                        {p.stock}
                      </div>
                      <div style={{ fontSize: '11px', color: '#991b1b', textTransform: 'uppercase', fontWeight: 700 }}>
                        {p.stock === 0 ? 'Out of Stock' : 'Units Left'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#16a085', backgroundColor: '#f4fbf9', borderRadius: '8px', border: '1px dashed #1abc9c' }}>
                <h3 style={{ marginBottom: '8px' }}>All Good!</h3>
                <p>No products are currently running low on stock.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'bestselling' && (
        <div className={styles.main}>
          {/* KPI Summary Cards */}
          <div className={styles.analyticsSummaryGrid}>
            <div className={styles.analyticsKpiCard}>
              <div className={styles.kpiIconWrapper}>🏆</div>
              <div className={styles.kpiContent}>
                <span className={styles.kpiLabel}>Top Moving Product</span>
                <span className={styles.kpiValue}>
                  {bestSellingData?.summary.topMovingProduct ? bestSellingData.summary.topMovingProduct.productName : 'None yet'}
                </span>
                <span className={styles.kpiSubtext}>
                  {bestSellingData?.summary.topMovingProduct
                    ? `${bestSellingData.summary.topMovingProduct.uniqueClientsCount} clients added to cart`
                    : 'Awaiting customer activity'}
                </span>
              </div>
            </div>

            <div className={styles.analyticsKpiCard}>
              <div className={styles.kpiIconWrapper}>🛒</div>
              <div className={styles.kpiContent}>
                <span className={styles.kpiLabel}>Total Cart Additions</span>
                <span className={styles.kpiValue}>
                  {bestSellingData?.summary.totalCartAdditions?.toLocaleString('en-IN') || 0}
                </span>
                <span className={styles.kpiSubtext}>Times products added across store</span>
              </div>
            </div>

            <div className={styles.analyticsKpiCard}>
              <div className={styles.kpiIconWrapper}>👥</div>
              <div className={styles.kpiContent}>
                <span className={styles.kpiLabel}>Shopping Clients</span>
                <span className={styles.kpiValue}>
                  {bestSellingData?.summary.totalClientsEngaged?.toLocaleString('en-IN') || 0}
                </span>
                <span className={styles.kpiSubtext}>Distinct client sessions</span>
              </div>
            </div>

            <div className={styles.analyticsKpiCard}>
              <div className={styles.kpiIconWrapper}>📦</div>
              <div className={styles.kpiContent}>
                <span className={styles.kpiLabel}>Products Tracked</span>
                <span className={styles.kpiValue}>
                  {bestSellingData?.summary.totalTrackedProducts || products.length}
                </span>
                <span className={styles.kpiSubtext}>Active in catalog</span>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className={styles.tableContainer}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-dark-navy)', margin: 0 }}>
                  Most Moving &amp; Cart-Added Products
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--color-secondary-text)', margin: '2px 0 0 0' }}>
                  Ranked by the number of unique clients who added each product to their cart.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="text"
                  placeholder="Filter by product name..."
                  value={bestSellingSearch}
                  onChange={(e) => setBestSellingSearch(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    minWidth: '220px',
                  }}
                />
                <button 
                  type="button" 
                  onClick={async () => {
                    const data = await apiGetBestSellingStats();
                    if (data) setBestSellingData(data);
                    toast.success('Refreshed cart analytics');
                  }}
                  className={styles.btnSoundTest}
                  title="Refresh analytics data"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Rank</th>
                  <th>Product</th>
                  <th>Brand &amp; Scale</th>
                  <th>Price</th>
                  <th>Clients Added to Cart</th>
                  <th>Total Cart Adds</th>
                  <th>Stock Status</th>
                  <th>Storefront Tag</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const items = (bestSellingData?.items || []).filter((item) => {
                    if (!bestSellingSearch.trim()) return true;
                    return item.productName.toLowerCase().includes(bestSellingSearch.toLowerCase()) ||
                           (item.productBrand || '').toLowerCase().includes(bestSellingSearch.toLowerCase());
                  });

                  if (items.length === 0) {
                    return (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                          No products found matching the criteria.
                        </td>
                      </tr>
                    );
                  }

                  return items.map((item, idx) => {
                    const isTop1 = idx === 0 && item.uniqueClientsCount > 0;
                    const isTop2 = idx === 1 && item.uniqueClientsCount > 0;
                    const isTop3 = idx === 2 && item.uniqueClientsCount > 0;

                    return (
                      <tr key={`bestsell-${item.productId}-${idx}`}>
                        <td>
                          <span className={`${styles.rankBadge} ${isTop1 ? styles.rankTopOne : isTop2 ? styles.rankTopTwo : isTop3 ? styles.rankTopThree : ''}`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {item.productImage ? (
                              <img 
                                src={item.productImage} 
                                alt={item.productName} 
                                style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '6px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} 
                              />
                            ) : (
                              <div style={{ width: '44px', height: '44px', borderRadius: '6px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                🏎️
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--color-dark-navy)', fontSize: '14px' }}>
                                {item.productName}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--color-secondary-text)' }}>
                                ID: {item.productId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, color: '#334155' }}>
                            {item.productBrand || 'Unbranded'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {item.productScale || 'Standard'}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--color-dark-navy)' }}>
                            ₹{(item.productPrice || 0).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td>
                          <span className={item.uniqueClientsCount > 0 ? styles.clientBadge : styles.clientBadgeZero}>
                            {item.uniqueClientsCount > 0 ? '🔥 ' : ''}
                            {item.uniqueClientsCount} {item.uniqueClientsCount === 1 ? 'client' : 'clients'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#3b82f6' }}>
                            {item.totalAdditions} {item.totalAdditions === 1 ? 'time' : 'times'}
                          </span>
                        </td>
                        <td>
                          {item.stock <= 0 ? (
                            <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '12px' }}>Out of Stock</span>
                          ) : item.stock <= 5 ? (
                            <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '12px' }}>Low: {item.stock} left</span>
                          ) : (
                            <span style={{ color: '#10b981', fontWeight: 600, fontSize: '12px' }}>In Stock ({item.stock})</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className={item.isBestseller ? styles.btnBestsellerActive : styles.btnBestsellerInactive}
                            onClick={() => handleToggleBestsellerTag(item.productId, item.isBestseller)}
                            title={item.isBestseller ? "Click to remove Storefront Bestseller badge" : "Click to mark as official Bestseller on storefront"}
                          >
                            {item.isBestseller ? '★ Bestseller' : '+ Mark Bestseller'}
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'offer' && (
        <div className={styles.offerContainer}>
          {/* Create Offer Card */}
          <div className={styles.offerCard}>
            <div className={styles.offerCardHeader}>
              <h2 className={styles.offerCardTitle}>
                <span>🏷️</span> Create Special Purchase Offer
              </h2>
              <p className={styles.offerCardSubtitle}>
                Specify a minimum purchase amount and an offer percentage. When a user buys products of this amount or more, that percentage discount is automatically applied.
              </p>
            </div>

            <form onSubmit={handleAddOffer}>
              <div className={styles.offerFormGrid}>
                {/* Purchase Amount Field */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    <span>Purchase Amount (₹) *</span>
                    <span className={styles.fieldHint}>Minimum cart/order total</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputPrefix}>₹</span>
                    <input 
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="e.g. 2000"
                      value={newOfferPurchaseAmount}
                      onChange={(e) => setNewOfferPurchaseAmount(e.target.value)}
                      className={styles.numberInput}
                    />
                  </div>
                  {/* Preset quick buttons */}
                  <div className={styles.presetGroup}>
                    {['500', '949', '1000', '1500', '2000', '3000', '5000'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className={`${styles.presetBtn} ${newOfferPurchaseAmount === preset ? styles.presetBtnActive : ''}`}
                        onClick={() => setNewOfferPurchaseAmount(preset)}
                      >
                        ₹{preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Offer Percentage Field */}
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    <span>Offer Percentage (%) *</span>
                    <span className={styles.fieldHint}>Discount percentage</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <input 
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      required
                      placeholder="e.g. 10"
                      value={newOfferPercentage}
                      onChange={(e) => setNewOfferPercentage(e.target.value)}
                      className={styles.numberInput}
                      style={{ paddingLeft: '14px' }}
                    />
                    <span className={styles.inputSuffix}>%</span>
                  </div>
                  {/* Preset quick buttons */}
                  <div className={styles.presetGroup}>
                    {['5', '10', '15', '20', '25', '30', '50'].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        className={`${styles.presetBtn} ${newOfferPercentage === pct ? styles.presetBtnActive : ''}`}
                        onClick={() => setNewOfferPercentage(pct)}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Live Customer Preview Banner */}
              <div className={styles.offerPreviewCard}>
                <div className={styles.offerPreviewIcon}>🎁</div>
                <div className={styles.offerPreviewContent}>
                  <div className={styles.offerPreviewTitle}>
                    Instant Customer Discount Rule Preview
                  </div>
                  <div className={styles.offerPreviewDesc}>
                    When a customer orders <strong>₹{Number(newOfferPurchaseAmount || 0).toLocaleString('en-IN')}</strong> or more, they will automatically receive a <strong>{newOfferPercentage || 0}% discount</strong> (e.g. saving ₹{Math.round(((Number(newOfferPurchaseAmount) || 0) * (Number(newOfferPercentage) || 0)) / 100).toLocaleString('en-IN')} on a ₹{Number(newOfferPurchaseAmount || 0).toLocaleString('en-IN')} purchase).
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  type="submit" 
                  disabled={isSavingOffer}
                  className={styles.btnAdd}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: isSavingOffer ? 'not-allowed' : 'pointer' }}
                >
                  {isSavingOffer ? 'Adding Offer...' : '✓ Add Offer'}
                </button>
              </div>
            </form>
          </div>

          {/* Active Offers Management Table */}
          <div className={styles.tableContainer}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-dark-navy)', margin: 0 }}>
                  Active Store Offers
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--color-secondary-text)', margin: '2px 0 0 0' }}>
                  Offers currently configured in the database and applied automatically at checkout.
                </p>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary-light-blue)' }}>
                {offers.length} {offers.length === 1 ? 'Offer' : 'Offers'} Configured
              </span>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Purchase Amount (₹)</th>
                  <th>Offer Discount (%)</th>
                  <th>Offer Description</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {offers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏷️</div>
                      <div style={{ fontWeight: 600 }}>No offers created yet</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        Use the form above to add your first offer (e.g. 10% OFF on ₹2000 purchase).
                      </div>
                    </td>
                  </tr>
                ) : (
                  offers.map((offer) => (
                    <tr key={offer.id}>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--color-dark-navy)', fontSize: '15px' }}>
                          ₹{offer.minPurchaseAmount.toLocaleString('en-IN')}
                        </span>
                        <div style={{ fontSize: '11px', color: 'var(--color-secondary-text)' }}>
                          or more
                        </div>
                      </td>
                      <td>
                        <span style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '13px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          display: 'inline-block'
                        }}>
                          {offer.discountPercentage}% OFF
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                          {offer.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          Save {offer.discountPercentage}% on purchases ₹{offer.minPurchaseAmount.toLocaleString('en-IN')} and above
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleOfferStatus(offer.id, offer.isActive)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="Click to toggle status"
                        >
                          {offer.isActive ? (
                            <span className={styles.statusActiveBadge}>● Active</span>
                          ) : (
                            <span className={styles.statusInactiveBadge}>○ Inactive</span>
                          )}
                        </button>
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>
                        {offer.createdAt ? new Date(offer.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            type="button"
                            className={styles.btnDelete}
                            onClick={() => handleDeleteOfferItem(offer.id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #fca5a5',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
