import { Schema, model, Document, Types } from 'mongoose';
import { CouponType } from '../types';

export interface ICoupon extends Document {
  code: string;
  type: CouponType;
  value: number;
  minimumPurchase: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  startDate: Date;
  endDate: Date;
  applicableCategories: Types.ObjectId[];
  applicableProducts: Types.ObjectId[];
  status: 'ACTIVE' | 'EXPIRED' | 'DISABLED';
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    type: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED', 'FREE_SHIPPING'],
      default: 'PERCENTAGE',
      required: true
    },
    value: { type: Number, required: true, min: 0 },
    minimumPurchase: { type: Number, default: 0, min: 0 },
    maximumDiscount: { type: Number, min: 0 },
    usageLimit: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    applicableCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    applicableProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'DISABLED'],
      default: 'ACTIVE',
      index: true
    }
  },
  { timestamps: true }
);

export const Coupon = model<ICoupon>('Coupon', CouponSchema);
