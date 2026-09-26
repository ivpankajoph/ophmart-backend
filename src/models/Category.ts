import { Schema, model, Document, Types } from 'mongoose';
import { ICloudinaryImage } from '../types';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  parent?: Types.ObjectId;
  level: number;
  image?: ICloudinaryImage;
  banner?: ICloudinaryImage;
  featured: boolean;
  order: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, trim: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    level: { type: Number, default: 0, index: true },
    image: {
      public_id: { type: String },
      secure_url: { type: String }
    },
    banner: {
      public_id: { type: String },
      secure_url: { type: String }
    },
    featured: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true }
  },
  { timestamps: true }
);

export const Category = model<ICategory>('Category', CategorySchema);
