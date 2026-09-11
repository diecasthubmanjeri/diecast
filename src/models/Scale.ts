import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IScaleDocument extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScaleSchema = new Schema<IScaleDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  {
    timestamps: true,
  }
);

export const ScaleModel: Model<IScaleDocument> =
  mongoose.models.Scale || mongoose.model<IScaleDocument>('Scale', ScaleSchema);

export default ScaleModel;
