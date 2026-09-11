import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'All Diecast Model Cars Catalog | Diecast Hub',
  description:
    'Browse our complete catalog of authentic diecast model cars, RC cars, and collectibles across all scales (1:64, 1:43, 1:32, 1:24, 1:18) from Hot Wheels, Mini GT, Bburago, Tomica and more.',
  alternates: {
    canonical: `${SITE_URL}/catalog`,
  },
  openGraph: {
    title: 'All Diecast Model Cars Catalog | Diecast Hub',
    description:
      'Browse authentic diecast model cars and collectibles across all scales and brands. Available for delivery across Kerala and India.',
    url: `${SITE_URL}/catalog`,
    siteName: 'Diecast Hub',
    images: [{ url: '/BANNERS-1.png' }],
  },
};

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
