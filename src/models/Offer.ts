import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOfferDocument extends Document {
  id: string;
  minPurchaseAmount: number;
  discountPercentage: number;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OfferSchema = new Schema<IOfferDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    minPurchaseAmount: { type: Number, required: true, min: 0 },
    discountPercentage: { type: Number, required: true, min: 1, max: 100 },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

export const OfferModel: Model<IOfferDocument> =
  mongoose.models.Offer || mongoose.model<IOfferDocument>('Offer', OfferSchema);

export default OfferModel;
