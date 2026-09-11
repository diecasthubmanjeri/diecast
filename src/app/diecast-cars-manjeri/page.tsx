import { Metadata } from 'next';
import Link from 'next/link';
import { FaMapMarkerAlt, FaRegClock, FaPhone, FaEnvelope, FaWhatsapp, FaDirections, FaShieldAlt, FaShippingFast, FaCar } from 'react-icons/fa';
import { SITE_URL, BUSINESS_INFO } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Diecast Cars Manjeri | Diecast Hub Kerala - Model Cars & Collectibles',
  description:
    'Visit Diecast Hub in Manjeri, Malappuram, Kerala or shop online. Authentic diecast model cars, RC cars & scale miniatures (1:64 to 1:18) from Hot Wheels, Mini GT, Bburago, Tomica & more. Door-to-door delivery across Kerala and India.',
  keywords: [
    'diecast cars manjeri',
    'diecast shop manjeri',
    'diecast cars kerala',
    'diecast cars malappuram',
    'model cars store kerala',
    'hot wheels manjeri',
    'mini gt kerala',
    'diecast hub manjeri',
    'diecast hub',
    'rc cars manjeri',
  ],
  alternates: {
    canonical: `${SITE_URL}/diecast-cars-manjeri`,
  },
  openGraph: {
    title: 'Diecast Cars Manjeri | Diecast Hub Kerala',
    description:
      'Explore Kerala’s premier destination for authentic diecast model cars, RC cars, and collectibles in Manjeri, Malappuram. Store visit & online ordering available.',
    url: `${SITE_URL}/diecast-cars-manjeri`,
    siteName: 'Diecast Hub',
    images: [
      {
        url: '/BANNERS-1.png',
        width: 1200,
        height: 630,
        alt: 'Diecast Hub Manjeri Store',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
};

const FAQS = [
  {
    question: 'Where is Diecast Hub located?',
    answer:
      'Diecast Hub is located at Kacherippadi, Manjeri, Malappuram district, Kerala, 676121, India. Customers can visit our physical store in person or order online through our website with door-to-door shipping.',
  },
  {
    question: 'What does Diecast Hub sell?',
    answer:
      'Diecast Hub specializes in authentic diecast model cars, remote-controlled (RC) cars, and collector miniatures across different scales including 1:64, 1:43, 1:32, 1:24, and 1:18 from world-class brands like Hot Wheels, Mini GT, Tarmac Works, Bburago, and Tomica.',
  },
  {
    question: 'Can customers visit the physical store in Manjeri?',
    answer:
      'Yes, customers are warmly welcome to visit our physical showroom in Kacherippadi, Manjeri. Our store is open from 10:30 AM to 10:00 PM every day of the week (Monday through Sunday).',
  },
  {
    question: 'Do you deliver diecast cars across Kerala and India?',
    answer:
      'Yes, we ship nationwide. Orders within Kerala typically arrive in 1 to 2 business days via Speed & Safe Courier. We also deliver across all states and remote regions in India through Indian Post and trusted courier partners.',
  },
  {
    question: 'What diecast scales are available at Diecast Hub?',
    answer:
      'We offer models in 1:64 (popular collector pocket-size and high-detail miniatures), 1:43 (fine detailing), 1:32, 1:24 (display models with opening doors and hoods), and 1:18 (large-format showcase models with intricate interiors and functional steering).',
  },
  {
    question: 'What brands of diecast models do you carry?',
    answer:
      'We stock authentic models from leading global diecast brands including Hot Wheels, Mini GT, Tarmac Works, Bburago, Tomica, Kinsmart, and Maisto, covering sports cars, supercars, classic muscle cars, vintage automobiles, and RC models.',
  },
  {
    question: 'Are all products at Diecast Hub authentic and licensed?',
    answer:
      'Yes, every single model car sold by Diecast Hub is 100% authentic, officially licensed by original automotive manufacturers, and sourced through authorized distribution channels. Every item is inspected for flawless paint, casting, and packaging before dispatch.',
  },
  {
    question: 'How can I order a diecast model car from Diecast Hub?',
    answer:
      'You can browse our full live catalog online at diecastshub.in, add items to your cart, and complete your order securely using Razorpay (UPI, Credit/Debit cards, Net Banking). Alternatively, you can message us on WhatsApp (+91 8111-993264) or visit our Manjeri showroom.',
  },
  {
    question: 'Do you offer pre-orders for upcoming diecast models?',
    answer:
      'Yes, we offer advance pre-orders for eagerly anticipated and limited-production releases. This guarantees you secure your model at the official reservation price before it sells out.',
  },
];

export default function ManjeriLocationPage() {
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'HobbyShop',
    name: 'Diecast Hub Manjeri',
    legalName: BUSINESS_INFO.legalName,
    url: `${SITE_URL}/diecast-cars-manjeri`,
    telephone: BUSINESS_INFO.telephone,
    email: BUSINESS_INFO.email,
    hasMap: BUSINESS_INFO.hasMap,
    priceRange: BUSINESS_INFO.priceRange,
    currenciesAccepted: 'INR',
    paymentAccepted: BUSINESS_INFO.paymentAccepted,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS_INFO.address.streetAddress,
      addressLocality: BUSINESS_INFO.address.addressLocality,
      addressRegion: BUSINESS_INFO.address.addressRegion,
      postalCode: BUSINESS_INFO.address.postalCode,
      addressCountry: BUSINESS_INFO.address.addressCountry,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: BUSINESS_INFO.geo.latitude,
      longitude: BUSINESS_INFO.geo.longitude,
    },
    openingHoursSpecification: BUSINESS_INFO.openingHoursSpecification.map((s) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: s.dayOfWeek,
      opens: s.opens,
      closes: s.closes,
    })),
    sameAs: BUSINESS_INFO.sameAs,
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

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
        name: 'Diecast Cars Manjeri',
        item: `${SITE_URL}/diecast-cars-manjeri`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', paddingBottom: '60px' }}>
        {/* Hero Section */}
        <section
          style={{
            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
            padding: '60px 20px 40px',
            borderBottom: '1px solid #334155',
          }}
        >
          <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(2, 132, 199, 0.15)',
                border: '1px solid #0284c7',
                color: '#38bdf8',
                padding: '6px 16px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '18px',
              }}
            >
              <FaMapMarkerAlt /> Kacherippadi, Manjeri, Malappuram, Kerala
            </div>

            <h1
              style={{
                fontSize: 'clamp(26px, 4vw, 42px)',
                fontWeight: 900,
                lineHeight: 1.2,
                color: '#ffffff',
                marginBottom: '16px',
                letterSpacing: '-0.5px',
              }}
            >
              Diecast Hub Manjeri — Kerala&apos;s Premier Model Cars Store
            </h1>

            <p
              style={{
                fontSize: '16px',
                color: '#94a3b8',
                maxWidth: '780px',
                margin: '0 auto 28px',
                lineHeight: 1.6,
              }}
            >
              Welcome to Diecast Hub, located in Kacherippadi, Manjeri. We are Kerala&apos;s dedicated destination for
              authentic diecast model cars, RC vehicles, and collector miniatures across 1:64, 1:43, 1:32, 1:24, and 1:18
              scales. Visit our showroom or order online for fast door-to-door delivery across Kerala and pan-India.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/catalog"
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '15px',
                  textDecoration: 'none',
                  transition: 'background-color 0.2s',
                }}
              >
                Browse All Models
              </Link>
              <a
                href="https://maps.app.goo.gl/MNECrUf4pB2k8xFE6?g_st=iw"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #475569',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '15px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FaDirections /> Get Directions
              </a>
              <a
                href="https://wa.me/918111993264?text=Hello%20Diecast%20Hub%20Manjeri!"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '15px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FaWhatsapp /> WhatsApp Us
              </a>
            </div>
          </div>
        </section>

        {/* Store Highlights Grid */}
        <section style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 20px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
            }}
          >
            {/* Location Card */}
            <div
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              <div style={{ color: '#38bdf8', fontSize: '24px', marginBottom: '12px' }}>
                <FaMapMarkerAlt />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>Store Address</h2>
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                Kacherippadi, Manjeri,<br />
                Malappuram District, Kerala — 676121
              </p>
              <a
                href="https://maps.app.goo.gl/MNECrUf4pB2k8xFE6?g_st=iw"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  color: '#38bdf8',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginTop: '12px',
                  textDecoration: 'underline',
                }}
              >
                Open in Google Maps ↗
              </a>
            </div>

            {/* Hours Card */}
            <div
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              <div style={{ color: '#38bdf8', fontSize: '24px', marginBottom: '12px' }}>
                <FaRegClock />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>Store Hours</h2>
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                <strong>10:30 AM – 10:00 PM</strong><br />
                Open All Days (Monday – Sunday)
              </p>
              <span
                style={{
                  display: 'inline-block',
                  color: '#4ade80',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginTop: '12px',
                  backgroundColor: 'rgba(74, 222, 128, 0.1)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                }}
              >
                Open Today
              </span>
            </div>

            {/* Direct Contact Card */}
            <div
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              <div style={{ color: '#38bdf8', fontSize: '24px', marginBottom: '12px' }}>
                <FaPhone />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>Call & WhatsApp</h2>
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.5, margin: '0 0 6px' }}>
                Phone: <a href="tel:+918111993264" style={{ color: '#f8fafc' }}>+91 8111-993264</a>
              </p>
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                Email: <a href="mailto:diecasthubmanjeri@gmail.com" style={{ color: '#f8fafc' }}>diecasthubmanjeri@gmail.com</a>
              </p>
            </div>

            {/* Shipping Card */}
            <div
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              <div style={{ color: '#38bdf8', fontSize: '24px', marginBottom: '12px' }}>
                <FaShippingFast />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>Kerala & All-India Shipping</h2>
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                Speed & Safe Courier (1–2 days in Kerala)<br />
                Indian Post Door-to-Door Delivery nationwide
              </p>
              <span style={{ display: 'block', color: '#38bdf8', fontSize: '12px', marginTop: '10px' }}>
                Free shipping on prepaid orders ₹949+
              </span>
            </div>
          </div>
        </section>

        {/* Collections Overview */}
        <section style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 20px' }}>
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              border: '1px solid #334155',
              padding: '36px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <FaCar size={22} color="#0284c7" />
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                What You Can Find at Diecast Hub
              </h2>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '15px', lineHeight: 1.7, marginBottom: '24px' }}>
              Whether you are an experienced hobbyist or just beginning your collection, Diecast Hub stocks officially
              licensed model cars covering supercars, luxury saloons, JDM tuner cars, classic vintage automobiles, and RC
              scale racers.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
              }}
            >
              <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>Available Scales</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                  1:64, 1:43, 1:32, 1:24, and 1:18 premium diecast models.
                </p>
              </div>

              <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>Featured Brands</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                  Hot Wheels, Mini GT, Tarmac Works, Bburago, Tomica, Kinsmart, and Maisto.
                </p>
              </div>

              <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>100% Authentic</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                  Brand new, officially licensed collector pieces in mint-condition packaging.
                </p>
              </div>

              <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>Pre-Order Access</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                  Reserve upcoming limited-run models with advance booking slots.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Factual Geo Q&A / FAQ Section */}
        <section style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
              Frequently Asked Questions (FAQ)
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              Clear, factual answers about our Manjeri store, ordering, shipping, and authentic products.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {FAQS.map((faq, index) => (
              <article
                key={index}
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  padding: '20px 24px',
                }}
              >
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#f8fafc',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '8px',
                  }}
                >
                  <span style={{ color: '#0284c7' }}>Q:</span> {faq.question}
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#cbd5e1',
                    lineHeight: 1.6,
                    margin: 0,
                    paddingLeft: '22px',
                  }}
                >
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{ maxWidth: '1100px', margin: '40px auto 0', padding: '0 20px', textAlign: 'center' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #1e40af 100%)',
              padding: '36px 24px',
              borderRadius: '16px',
              color: '#ffffff',
            }}
          >
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '10px' }}>
              Looking for a Specific Model or Scale?
            </h2>
            <p style={{ fontSize: '15px', color: '#e0f2fe', maxWidth: '600px', margin: '0 auto 20px' }}>
              Check out our complete catalog online or visit our Manjeri store to discover rare editions and new arrivals.
            </p>
            <Link
              href="/catalog"
              style={{
                backgroundColor: '#ffffff',
                color: '#0369a1',
                padding: '12px 28px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '15px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Explore Full Collection
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
