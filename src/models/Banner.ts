import { Schema, model, Document } from 'mongoose';
import { ICloudinaryImage } from '../types';

export interface IBanner extends Document {
  title: string;
  subtitle?: string;
  image: ICloudinaryImage;
  mobileImage?: ICloudinaryImage;
  ctaText: string;
  ctaLink: string;
  type: 'HERO' | 'PROMO' | 'CATEGORY' | 'EDITORIAL' | 'HOMEPAGE';
  priority: number;
  startDate?: Date;
  endDate?: Date;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    image: {
      public_id: { type: String },
      secure_url: { type: String, required: true }
    },
    mobileImage: {
      public_id: { type: String },
      secure_url: { type: String }
    },
    ctaText: { type: String, required: true, default: 'EXPLORE COLLECTION' },
    ctaLink: { type: String, required: true, default: '/collections/new-arrivals' },
    type: {
      type: String,
      enum: ['HERO', 'PROMO', 'CATEGORY', 'EDITORIAL', 'HOMEPAGE'],
      default: 'HERO',
      index: true
    },
    priority: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true }
  },
  { timestamps: true }
);

export const Banner = model<IBanner>('Banner', BannerSchema);
