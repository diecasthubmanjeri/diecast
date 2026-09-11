export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://diecastshub.in';

export const BUSINESS_INFO = {
  name: 'Diecast Hub',
  legalName: 'Diecast Hub Manjeri',
  alternateName: ['Diecast Hub India', 'Diecast Hub Kerala', 'Diecast Hub Model Cars'],
  url: SITE_URL,
  logo: `${SITE_URL}/LOGO.png`,
  image: `${SITE_URL}/BANNERS-1.png`,
  telephone: '+918111993264',
  email: 'diecasthubmanjeri@gmail.com',
  address: {
    streetAddress: 'Kacherippadi',
    addressLocality: 'Manjeri',
    addressRegion: 'Kerala',
    postalCode: '676121',
    addressCountry: 'IN',
  },
  geo: {
    latitude: 11.1217,
    longitude: 76.1211,
  },
  hasMap: 'https://maps.app.goo.gl/MNECrUf4pB2k8xFE6?g_st=iw',
  openingHoursSpecification: [
    {
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: '10:30',
      closes: '22:00',
    },
  ],
  priceRange: '₹₹',
  currenciesAccepted: 'INR',
  paymentAccepted: 'Cash, Credit Card, Debit Card, UPI, Net Banking, Razorpay',
  sameAs: [
    'https://www.instagram.com/diecast__hub_?stkn=aGFqYmV6dWtjOWN6&utm_source=qr',
    'https://www.facebook.com/profile.php?id=61592186271650&ref=PROFILE_EDIT_xav_ig_profile_page_web',
    'https://wa.me/918111993264',
  ],
  areaServed: [
    { name: 'Manjeri' },
    { name: 'Malappuram' },
    { name: 'Kerala' },
    { name: 'India' },
  ],
};

export function getAbsoluteUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}
