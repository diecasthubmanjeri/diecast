import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICartAnalyticsDocument extends Document {
  productId: string;
  productName: string;
  productImage?: string;
  productScale?: string;
  productBrand?: string;
  productPrice?: number;
  clientSessionIds: string[];
  uniqueClientsCount: number;
  totalAdditions: number;
  lastAddedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CartAnalyticsSchema = new Schema<ICartAnalyticsDocument>(
  {
    productId: { type: String, required: true, unique: true, index: true },
    productName: { type: String, required: true, trim: true },
    productImage: { type: String, default: '' },
    productScale: { type: String, default: '' },
    productBrand: { type: String, default: '' },
    productPrice: { type: Number, default: 0 },
    clientSessionIds: { type: [String], default: [] },
    uniqueClientsCount: { type: Number, default: 0, index: true },
    totalAdditions: { type: Number, default: 0 },
    lastAddedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const CartAnalyticsModel: Model<ICartAnalyticsDocument> =
  mongoose.models.CartAnalytics ||
  mongoose.model<ICartAnalyticsDocument>('CartAnalytics', CartAnalyticsSchema);

export default CartAnalyticsModel;
