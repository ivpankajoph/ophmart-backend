import { Schema, model, Document, Types } from 'mongoose';

export interface ICartItem {
  _id?: Types.ObjectId;
  product: Types.ObjectId;
  variant?: Types.ObjectId;
  sku: string;
  name: string;
  color?: string;
  size?: string;
  image: string;
  price: number;
  quantity: number;
}

export interface ICart extends Document {
  user?: Types.ObjectId;
  guestId?: string;
  items: ICartItem[];
  coupon?: Types.ObjectId;
  giftWrap: boolean;
  giftMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant' },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    color: { type: String },
    size: { type: String },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 }
  },
  { _id: true }
);

const CartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    guestId: { type: String, index: true },
    items: [CartItemSchema],
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    giftWrap: { type: Boolean, default: false },
    giftMessage: { type: String }
  },
  { timestamps: true }
);

export const Cart = model<ICart>('Cart', CartSchema);
