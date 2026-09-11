import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAdminDocument extends Document {
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  passwordVersion: number;
  otpHash?: string;
  otpExpiresAt?: Date;
  otpAttempts?: number;
  otpLastSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdminDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
      required: true,
    },
    passwordVersion: {
      type: Number,
      default: 1,
    },
    otpHash: {
      type: String,
    },
    otpExpiresAt: {
      type: Date,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
    otpLastSentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const AdminModel: Model<IAdminDocument> =
  mongoose.models.Admin || mongoose.model<IAdminDocument>('Admin', AdminSchema);
