'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // When pathname or searchParams change, complete the progress bar
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept click on any internal <a> or <Link> to immediately trigger the progress bar
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      const isTargetBlank = anchor.getAttribute('target') === '_blank';
      const isExternal = anchor.hostname && anchor.hostname !== window.location.hostname;
      const isSamePath = anchor.pathname === window.location.pathname && anchor.search === window.location.search;
      const isHashLink = href?.startsWith('#');

      if (href && !isTargetBlank && !isExternal && !isSamePath && !isHashLink) {
        setLoading(true);
        setProgress(30);

        // Advance smoothly while page is fetching
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 85) {
              clearInterval(interval);
              return 85;
            }
            return prev + 15;
          });
        }, 120);

        setTimeout(() => clearInterval(interval), 4000);
      }
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        zIndex: 999999,
        pointerEvents: 'none',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          backgroundColor: '#38bdf8',
          boxShadow: '0 0 10px #38bdf8, 0 0 5px #0284c7',
          transition: progress === 100 ? 'width 0.15s ease-out, opacity 0.25s ease' : 'width 0.2s ease-in-out',
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
