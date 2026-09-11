'use client';
import { useState, useEffect } from 'react';
import styles from './ImageHero.module.css';

const HERO_SLIDES = [
  {
    id: 1,
    image: 'ChatGPT Image Aug 30, 2026, 01_14_15 AM.png',
    link: '/catalog'
  },
  {
    id: 2,
    image: 'imgban.png',
    link: '/catalog?scale=1-18'
  },
    {
    id: 3,
    image: 'new img.png',
    link: '/catalog?scale=1-18'
  }
];

export default function ImageHero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.heroContainer}>
      <div className={styles.carouselWrapper}>
        <div 
          className={styles.slidesTrack}
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {HERO_SLIDES.map((slide) => (
            <a 
              key={slide.id} 
              href={slide.link} 
              className={styles.slide}
            >
              <img src={slide.image} alt="Promotional Banner" className={styles.slideImage} />
            </a>
          ))}
        </div>
      </div>
      
      <div className={styles.indicators}>
        {HERO_SLIDES.map((_, index) => (
          <button 
            key={index} 
            className={`${styles.indicator} ${index === currentSlide ? styles.activeIndicator : ''}`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
