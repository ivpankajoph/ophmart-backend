import { Schema, model, Document, Types } from 'mongoose';
import { ICloudinaryImage } from '../types';

export interface IReturnRequest extends Document {
  order: Types.ObjectId;
  user: Types.ObjectId;
  product: Types.ObjectId;
  variant?: Types.ObjectId;
  reason: 'Wrong size' | 'Damaged' | 'Wrong product' | 'Changed mind' | 'Other';
  description?: string;
  images: ICloudinaryImage[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED';
  adminNotes?: string;
  refundAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnRequestSchema = new Schema<IReturnRequest>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant' },
    reason: {
      type: String,
      enum: ['Wrong size', 'Damaged', 'Wrong product', 'Changed mind', 'Other'],
      required: true
    },
    description: { type: String },
    images: [
      {
        public_id: { type: String },
        secure_url: { type: String }
      }
    ],
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'REFUNDED'],
      default: 'PENDING',
      index: true
    },
    adminNotes: { type: String },
    refundAmount: { type: Number, required: true, default: 0 }
  },
  { timestamps: true }
);

export const ReturnRequest = model<IReturnRequest>('ReturnRequest', ReturnRequestSchema);
