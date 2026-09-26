import { Schema, model, Document, Types } from 'mongoose';
import { OrderStatus, PaymentMethod, PaymentStatus, IUserAddress } from '../types';

export interface IOrderStatusHistory {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  user?: Types.ObjectId;
  guestEmail?: string;
  items: {
    product: Types.ObjectId;
    variant?: Types.ObjectId;
    sku: string;
    name: string;
    color?: string;
    size?: string;
    image: string;
    price: number;
    quantity: number;
    total: number;
  }[];
  shippingAddress: IUserAddress;
  billingAddress: IUserAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDetails?: {
    transactionId?: string;
    provider?: string;
    paidAt?: Date;
  };
  orderStatus: OrderStatus;
  statusHistory: IOrderStatusHistory[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  coupon?: Types.ObjectId;
  couponCode?: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: Date;
  giftWrap?: boolean;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    guestEmail: { type: String },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant' },
        sku: { type: String, required: true },
        name: { type: String, required: true },
        color: { type: String },
        size: { type: String },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        total: { type: Number, required: true }
      }
    ],
    shippingAddress: { type: Object, required: true },
    billingAddress: { type: Object, required: true },
    paymentMethod: {
      type: String,
      enum: ['STRIPE', 'RAZORPAY', 'COD'],
      default: 'COD',
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING'
    },
    paymentDetails: {
      transactionId: { type: String },
      provider: { type: String },
      paidAt: { type: Date }
    },
    orderStatus: {
      type: String,
      enum: [
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'RETURN_REQUESTED',
        'RETURNED',
        'REFUNDED'
      ],
      default: 'CONFIRMED',
      index: true
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String }
      }
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    couponCode: { type: String },
    trackingNumber: { type: String },
    carrier: { type: String, default: 'BlueDart Express Luxury' },
    estimatedDelivery: { type: Date },
    giftWrap: { type: Boolean, default: false },
    cancelReason: { type: String }
  },
  { timestamps: true }
);

export const Order = model<IOrder>('Order', OrderSchema);
