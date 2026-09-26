import { Schema, model, Document } from 'mongoose';
import { ICloudinaryImage } from '../types';

export interface IBrand extends Document {
  name: string;
  slug: string;
  description?: string;
  logo?: ICloudinaryImage;
  banner?: ICloudinaryImage;
  originCountry?: string;
  featured: boolean;
  website?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const BrandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, trim: true },
    logo: {
      public_id: { type: String },
      secure_url: { type: String }
    },
    banner: {
      public_id: { type: String },
      secure_url: { type: String }
    },
    originCountry: { type: String, default: 'France' },
    featured: { type: Boolean, default: false, index: true },
    website: { type: String },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true }
  },
  { timestamps: true }
);

export const Brand = model<IBrand>('Brand', BrandSchema);
