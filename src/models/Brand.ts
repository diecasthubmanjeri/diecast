import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBrandDocument extends Document {
  name: string;
  logo: string;
  createdAt: Date;
  updatedAt: Date;
}

const BrandSchema = new Schema<IBrandDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    logo: { type: String, default: '', trim: true },
  },
  {
    timestamps: true,
  }
);

export const BrandModel: Model<IBrandDocument> =
  mongoose.models.Brand || mongoose.model<IBrandDocument>('Brand', BrandSchema);

export default BrandModel;
