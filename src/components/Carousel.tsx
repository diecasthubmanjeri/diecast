'use client';

import React, { useRef } from 'react';
import styles from './Carousel.module.css';

interface CarouselProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function Carousel({ children, title, subtitle }: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        
        <div className={styles.controls}>
          <button 
            onClick={() => scroll('left')} 
            className={styles.controlBtn}
            aria-label="Scroll left"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <button 
            onClick={() => scroll('right')} 
            className={styles.controlBtn}
            aria-label="Scroll right"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className={styles.viewport} ref={scrollRef}>
        <div className={styles.container}>
          {children}
        </div>
      </div>
    </section>
  );
}
