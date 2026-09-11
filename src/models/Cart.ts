import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICartItem {
  id: string;
  name: string;
  scale: string;
  price: number;
  quantity: number;
  image: string;
  color?: string;
}

export interface ICartDocument extends Document {
  sessionId: string;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    scale: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: '' },
    color: { type: String, default: '' },
  },
  { _id: false }
);

const CartSchema = new Schema<ICartDocument>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    items: { type: [CartItemSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

// Optional: auto-expire abandoned carts after 60 days of inactivity
CartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 24 * 3600 });

export const CartModel: Model<ICartDocument> =
  mongoose.models.Cart || mongoose.model<ICartDocument>('Cart', CartSchema);

export default CartModel;
