import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchProductBySlug } from '@/lib/products';
import { SITE_URL, BUSINESS_INFO } from '@/lib/siteConfig';
import { isPreorderProduct } from '@/data/products';
import ProductDetailClient from './ProductDetailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested diecast model car could not be found at Diecast Hub.',
      robots: { index: false, follow: false },
    };
  }

  const isPreorder = isPreorderProduct(product);
  const title = `${product.name} (${product.scale}) | Diecast Hub`;
  const description = `Buy ${product.name} (${product.scale} scale) by ${product.brand} at Diecast Hub. ${
    isPreorder ? 'Reserve your pre-order model today.' : 'Premium authentic diecast model car collectible.'
  } Fast, secure shipping across Kerala and all India.`;

  const canonicalUrl = `${SITE_URL}/product/${encodeURIComponent(product.slug || product.id)}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Diecast Hub',
      images: [
        {
          url: product.image,
          width: 800,
          height: 600,
          alt: `${product.name} ${product.scale} diecast model`,
        },
      ],
      type: 'website',
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [product.image],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const isPreorder = isPreorderProduct(product);
  const effectivePrice =
    isPreorder && product.preorderAmount && product.preorderAmount > 0
      ? product.preorderAmount
      : product.price;

  const canonicalUrl = `${SITE_URL}/product/${encodeURIComponent(product.slug || product.id)}`;
  const productImages = [product.image, ...(product.gallery || [])].filter(Boolean);

  // Schema.org Product Structured Data
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: productImages,
    description: `Authentic ${product.scale} scale diecast model of ${product.name} by ${product.brand}. Features premium diecast metal construction with realistic details.`,
    sku: product.id,
    mpn: product.model || product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    category: product.category,
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'INR',
      price: effectivePrice,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability:
        product.stock > 0 || isPreorder
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: BUSINESS_INFO.name,
        url: BUSINESS_INFO.url,
      },
    },
  };

  // Schema.org BreadcrumbList Structured Data
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Catalog',
        item: `${SITE_URL}/catalog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.category || 'Diecast Models',
        item: `${SITE_URL}/catalog?category=${encodeURIComponent(product.category || '')}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: product.name,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}
