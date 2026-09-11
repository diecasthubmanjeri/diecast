import mongoose, { Schema, Model } from 'mongoose';

export interface IProduct {
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
  badge?: string;
  badgeTag?: string;
  isPreorder?: boolean;
  releaseDate?: string;
  preorderAmount?: number;
  colors?: string[];
  colorImages?: { color: string; images: string[] }[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    brand: { type: String, required: true, index: true, trim: true },
    scale: { type: String, required: true, index: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    discount: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    reviews: { type: Number, default: 0, min: 0 },
    model: { type: String, default: '', trim: true },
    category: { type: String, required: true, index: true, trim: true },
    image: { type: String, required: true, trim: true },
    gallery: { type: [String], default: [] },
    isNew: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    badge: { type: String, default: '', trim: true },
    badgeTag: { type: String, default: '', trim: true },
    isPreorder: { type: Boolean, default: false, index: true },
    releaseDate: { type: String, default: '', trim: true },
    preorderAmount: { type: Number, default: 0, min: 0 },
    colors: { type: [String], default: [] },
    colorImages: [{
      color: { type: String, required: true },
      images: { type: [String], default: [] }
    }],
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true,
  }
);

ProductSchema.index({ name: 'text', brand: 'text', model: 'text', category: 'text' });

export const ProductModel: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default ProductModel;
