import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReservationItem {
  productId: string;
  quantity: number;
}

export interface IReservationDocument extends Document {
  razorpayOrderId: string;
  items: IReservationItem[];
  expiresAt: Date;
  createdAt: Date;
}

const ReservationItemSchema = new Schema<IReservationItem>(
  {
    productId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const ReservationSchema = new Schema<IReservationDocument>(
  {
    razorpayOrderId: { type: String, required: true, unique: true, index: true },
    items: { type: [ReservationItemSchema], required: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true }
);

export const ReservationModel: Model<IReservationDocument> =
  mongoose.models.Reservation ||
  mongoose.model<IReservationDocument>('Reservation', ReservationSchema);
