'use client';
import { useState, useEffect } from 'react';
import { processFileToTransparentPng } from '../utils/image';

interface Props {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function TransparentCategoryImg({ src, alt, className, style }: Props) {
  const [processedSrc, setProcessedSrc] = useState<string>(src);

  useEffect(() => {
    if (!src) return;
    
    // Only process data URLs that are explicitly non-transparent JPEGs/JPGs
    if (src.startsWith('data:image/jpeg') || src.startsWith('data:image/jpg')) {
      let isMounted = true;
      processFileToTransparentPng(src, 600, 600).then((cleanUrl) => {
        if (isMounted && cleanUrl) {
          setProcessedSrc(cleanUrl);
        }
      }).catch(() => {
        if (isMounted) setProcessedSrc(src);
      });
      return () => {
        isMounted = false;
      };
    } else {
      setProcessedSrc(src);
    }
  }, [src]);

  return (
    <img 
      src={processedSrc} 
      alt={alt} 
      className={className} 
      style={{
        objectFit: 'contain',
        backgroundColor: 'transparent',
        ...style
      }} 
    />
  );
}
