import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INewsDocument extends Document {
  id: string;
  text: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NewsSchema = new Schema<INewsDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    text: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const NewsModel: Model<INewsDocument> =
  mongoose.models.News || mongoose.model<INewsDocument>('News', NewsSchema);

export default NewsModel;
