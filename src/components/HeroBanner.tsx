'use client';
import { useState, useEffect } from 'react';
import { apiGetBanners, Banner } from '../utils/api';
import styles from './HeroBanner.module.css';

export default function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<Banner[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let isSubscribed = true;
    async function loadBanners() {
      try {
        const data = await apiGetBanners();
        if (isSubscribed && data && data.length > 0) {
          setSlides(data);
        }
      } catch (e) {
        console.error('Error loading banners', e);
      } finally {
        if (isSubscribed) setMounted(true);
      }
    }
    loadBanners();
    return () => { isSubscribed = false; };
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (!mounted || slides.length === 0) {
    return <div className={styles.bannerContainer} style={{ minHeight: '160px' }}></div>; // placeholder
  }

  return (
    <div className={styles.bannerContainer}>
      <div 
        className={styles.slidesWrapper} 
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className={styles.slide}>
            <div className={styles.slideContent}>
              <div className={styles.textLeft}>
                <h2 className={styles.italicTitle}>{slide.italicTitle}</h2>
                <h1 className={styles.mainTitle}>{slide.mainTitle}</h1>
                <p className={styles.subTitle}>{slide.subTitle}</p>
              </div>
              <div className={styles.textRight}>
                <div className={styles.promoGraphic}>
                  <span className={styles.promoEmoji}>{slide.promoEmoji}</span>
                </div>
                <p className={styles.noCoupon}>{slide.noCouponText}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.dots}>
        {slides.map((_, idx) => (
          <button 
            key={idx} 
            className={`${styles.dot} ${idx === currentSlide ? styles.activeDot : ''}`}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
