import { Schema, model, Document, Types } from 'mongoose';
import { ICloudinaryImage } from '../types';

export interface IProductVariant extends Document {
  product: Types.ObjectId;
  sku: string;
  color: string;
  colorCode?: string;
  size: string;
  price: number;
  salePrice?: number;
  stock: number;
  images: ICloudinaryImage[];
  barcode?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
  createdAt: Date;
  updatedAt: Date;
}

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    color: { type: String, required: true, trim: true },
    colorCode: { type: String, trim: true },
    size: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    images: [
      {
        public_id: { type: String },
        secure_url: { type: String, required: true },
        alt: { type: String }
      }
    ],
    barcode: { type: String },
    weight: { type: Number },
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number }
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'],
      default: 'ACTIVE',
      index: true
    }
  },
  { timestamps: true }
);

export const ProductVariant = model<IProductVariant>('ProductVariant', ProductVariantSchema);
