export interface Brand {
  name: string;
  logo: string;
}

export interface Category {
  name: string;
  image: string;
  subtitle?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  scale: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  stock: number;
  rating: number;
  reviews: number;
  model: string;
  category: string;
  image: string;
  gallery: string[];
  isNew?: boolean;
  isBestseller?: boolean;
  badge?: string; // 'coming-soon' | 'new' | 'bestseller' etc.
  badgeTag?: string; // e.g. 'Coming Soon'
  isPreorder?: boolean;
  releaseDate?: string;
  preorderAmount?: number;
  colors?: string[];
  colorImages?: { color: string; images: string[] }[];
}

export const isPreorderProduct = (product: Product): boolean => {
  if (!product) return false;
  if (product.isPreorder) return true;
  const tag = (product.badgeTag || product.badge || '').toLowerCase().trim();
  return (
    tag === 'coming soon' ||
    tag === 'coming-soon' ||
    tag === 'comming soon' ||
    tag === 'comming sson' ||
    tag === 'preorder' ||
    tag === 'pre-order'
  );
};

export const mockProducts: Product[] = [];

export const defaultScales = ["1:64", "1:43", "1:32", "1:24", "1:18"];
export const defaultBrands: Brand[] = [
  { name: "Hot Wheels", logo: "" },
  { name: "MINI GT", logo: "" },
  { name: "Tarmac Works", logo: "" },
  { name: "Tomica", logo: "" },
  { name: "Bburago", logo: "" },
  { name: "Kaido House", logo: "" },
  { name: "POP Race", logo: "" },
  { name: "Majorette", logo: "" }
];

export const defaultCategories: Category[] = [
  { name: "RC Cars", image: "/categories/rc-cars.png", subtitle: "MASTER THE TRACK. RACE WITH PRECISION." },
  { name: "RC Crawlers", image: "/categories/rc-crawlers.png", subtitle: "CHOOSE YOUR DISCIPLINE. BUILD YOUR FLEET." },
  { name: "RC Planes", image: "/categories/rc-planes.png", subtitle: "ELEVATE YOUR SPACE. SHOWCASE YOUR PASSION." },
  { name: "RC Helicopters", image: "/categories/rc-helicopters.png", subtitle: "GEAR UP. ENHANCE YOUR LIFESTYLE." },
  { name: "Huina Construction Zone", image: "/categories/huina-construction-zone.png", subtitle: "HEAVY DUTY CONSTRUCTION MACHINES." },
  { name: "Monster Trucks", image: "/categories/monster-trucks.png", subtitle: "UNLEASH OFF-ROAD POWER." }
];
export const collections = [
  "JDM Legends",
  "Supercars",
  "HyperCars",
  "European Classics",
  "American Muscle",
  "Racing Cars",
  "Classic Cars",
  "Motorcycles"
];
