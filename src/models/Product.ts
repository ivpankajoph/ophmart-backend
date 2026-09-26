import { Schema, model, Document, Types } from 'mongoose';
import { ICloudinaryImage } from '../types';

export interface IProduct extends Document {
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription?: string;
  brand: Types.ObjectId;
  category: Types.ObjectId;
  subCategory?: Types.ObjectId;
  collections: string[];
  tags: string[];
  gender: 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS' | 'HOME' | 'ELECTRONICS';
  material?: string;
  colors: string[];
  sizes: string[];
  variants: Types.ObjectId[];
  images: ICloudinaryImage[];
  videos?: string[];
  price: number;
  compareAtPrice?: number;
  salePrice?: number;
  currency: string;
  tax: number;
  inventory: number;
  ratings: number;
  reviewsCount: number;
  featured: boolean;
  trending: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  details: {
    careInstructions?: string[];
    fit?: string;
    origin?: string;
    highlights?: string[];
    modelStats?: string;
  };
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    subCategory: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
    collections: [{ type: String, index: true }],
    tags: [{ type: String, index: true }],
    gender: {
      type: String,
      enum: ['MEN', 'WOMEN', 'UNISEX', 'KIDS', 'HOME', 'ELECTRONICS'],
      default: 'UNISEX',
      index: true
    },
    material: { type: String, index: true },
    colors: [{ type: String }],
    sizes: [{ type: String }],
    variants: [{ type: Schema.Types.ObjectId, ref: 'ProductVariant' }],
    images: [
      {
        public_id: { type: String },
        secure_url: { type: String, required: true },
        alt: { type: String },
        width: { type: Number },
        height: { type: Number }
      }
    ],
    videos: [{ type: String }],
    price: { type: Number, required: true, min: 0, index: true },
    compareAtPrice: { type: Number, min: 0 },
    salePrice: { type: Number, min: 0 },
    currency: { type: String, default: 'INR' },
    tax: { type: Number, default: 18 },
    inventory: { type: Number, required: true, default: 0, min: 0 },
    ratings: { type: Number, default: 5, min: 0, max: 5, index: true },
    reviewsCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false, index: true },
    trending: { type: Boolean, default: false, index: true },
    newArrival: { type: Boolean, default: false, index: true },
    bestSeller: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'PUBLISHED',
      index: true
    },
    details: {
      careInstructions: [{ type: String }],
      fit: { type: String },
      origin: { type: String },
      highlights: [{ type: String }],
      modelStats: { type: String }
    },
    seo: {
      title: { type: String },
      description: { type: String },
      keywords: [{ type: String }]
    }
  },
  { timestamps: true }
);

ProductSchema.index({
  name: 'text',
  description: 'text',
  shortDescription: 'text',
  tags: 'text',
  material: 'text'
});

export const Product = model<IProduct>('Product', ProductSchema);
