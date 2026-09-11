import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBannerDocument extends Document {
  id: string;
  italicTitle: string;
  mainTitle: string;
  subTitle: string;
  promoEmoji: string;
  noCouponText: string;
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBannerDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    italicTitle: { type: String, default: '', trim: true },
    mainTitle: { type: String, required: true, trim: true },
    subTitle: { type: String, default: '', trim: true },
    promoEmoji: { type: String, default: '🏎️', trim: true },
    noCouponText: { type: String, default: 'No Coupon Code Required', trim: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const BannerModel: Model<IBannerDocument> =
  mongoose.models.Banner || mongoose.model<IBannerDocument>('Banner', BannerSchema);

export default BannerModel;
