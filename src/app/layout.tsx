import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Header from "../components/Header";
import AnnouncementBar from "../components/AnnouncementBar";
import Footer from "../components/Footer";
import "./globals.css";
import { SITE_URL, BUSINESS_INFO } from "@/lib/siteConfig";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0284c7",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Diecast Hub | Premium Diecast Model Cars & Collectibles in India",
    template: "%s | Diecast Hub",
  },
  description:
    "Buy authentic diecast model cars, RC cars & collectibles in India. Shop 1:64, 1:43, 1:32, 1:24, 1:18 scale models from Hot Wheels, Mini GT, Bburago, Tomica and Tarmac Works at Diecast Hub Manjeri, Kerala. Fast shipping across India.",
  keywords: [
    "diecast cars",
    "diecast model cars",
    "diecast hub",
    "diecast hub manjeri",
    "diecast cars kerala",
    "diecast cars malappuram",
    "scale models india",
    "mini gt india",
    "hot wheels collector",
    "tarmac works",
    "bburago",
    "1:64 diecast",
    "1:24 diecast cars",
    "1:18 scale models",
    "rc cars",
    "model cars shop kerala",
  ],
  authors: [{ name: "Diecast Hub" }],
  creator: "Diecast Hub",
  publisher: "Diecast Hub",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Diecast Hub | Premium Diecast Model Cars & Collectibles in India",
    description:
      "Explore India's premier collection of authentic diecast model cars across all scales (1:64 to 1:18). Fast, secure delivery across Kerala and India from Diecast Hub Manjeri.",
    url: SITE_URL,
    siteName: "Diecast Hub",
    images: [
      {
        url: "/BANNERS-1.png",
        width: 1200,
        height: 630,
        alt: "Diecast Hub - Authentic Model Cars & Collectibles",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Diecast Hub | Premium Diecast Model Cars & Collectibles",
    description:
      "Shop authentic diecast model cars from leading global brands with fast door-to-door shipping across India.",
    images: ["/BANNERS-1.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

import { Toaster } from "react-hot-toast";
import { CartProvider } from "../context/CartContext";
import ScrollToTop from "../components/ScrollToTop";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Website Schema with SearchAction
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Diecast Hub",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/catalog?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  // LocalBusiness / Store Schema
  const storeSchema = {
    "@context": "https://schema.org",
    "@type": "HobbyShop",
    name: BUSINESS_INFO.name,
    legalName: BUSINESS_INFO.legalName,
    alternateName: BUSINESS_INFO.alternateName,
    url: BUSINESS_INFO.url,
    logo: BUSINESS_INFO.logo,
    image: BUSINESS_INFO.image,
    telephone: BUSINESS_INFO.telephone,
    email: BUSINESS_INFO.email,
    hasMap: BUSINESS_INFO.hasMap,
    priceRange: BUSINESS_INFO.priceRange,
    currenciesAccepted: BUSINESS_INFO.currenciesAccepted,
    paymentAccepted: BUSINESS_INFO.paymentAccepted,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS_INFO.address.streetAddress,
      addressLocality: BUSINESS_INFO.address.addressLocality,
      addressRegion: BUSINESS_INFO.address.addressRegion,
      postalCode: BUSINESS_INFO.address.postalCode,
      addressCountry: BUSINESS_INFO.address.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS_INFO.geo.latitude,
      longitude: BUSINESS_INFO.geo.longitude,
    },
    openingHoursSpecification: BUSINESS_INFO.openingHoursSpecification.map((s) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: s.dayOfWeek,
      opens: s.opens,
      closes: s.closes,
    })),
    sameAs: BUSINESS_INFO.sameAs,
    areaServed: BUSINESS_INFO.areaServed.map((a) => ({
      "@type": "AdministrativeArea",
      name: a.name,
    })),
  };

  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
        />
      </head>
      <body>
        <CartProvider>
          <ScrollToTop />
          <Suspense fallback={<div style={{ height: "72px" }} />}>
            <Header />
          </Suspense>
          <AnnouncementBar />
          <main>{children}</main>
          <Footer />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#333",
                color: "#fff",
                borderRadius: "8px",
              },
            }}
            containerStyle={{
              zIndex: 99999,
            }}
          />
        </CartProvider>
      </body>
    </html>
  );
}
