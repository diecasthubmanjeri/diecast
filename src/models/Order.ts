import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  scale?: string;
  color?: string;
}

export interface IOrderDocument extends Document {
  id: string;
  date: Date;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  shippingPartner?: string;
  items: IOrderItem[];
  subtotal?: number;
  discountAmount?: number;
  offerApplied?: string;
  totalAmount: number;
  sessionId?: string; 
  trackingId?: string;
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: '' },
    scale: { type: String, default: '' },
    color: { type: String, default: '' },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrderDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    date: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    customerPhone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pinCode: { type: String, required: true, trim: true },
    shippingPartner: { type: String, default: 'Indian Post (Door-to-Door Delivery)' },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    offerApplied: { type: String, default: '' },
    totalAmount: { type: Number, required: true, min: 0 },
    sessionId: { type: String, index: true },
    trackingId: { type: String, default: '' },
    paymentMethod: { type: String, default: 'Razorpay' },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Failed'],
      default: 'Paid',
    },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ date: -1 });

export const OrderModel: Model<IOrderDocument> =
  mongoose.models.Order || mongoose.model<IOrderDocument>('Order', OrderSchema);

export default OrderModel;
