export type UserRole = 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN' | 'MANAGER';

export interface IUserAddress {
  _id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface ICloudinaryImage {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  format?: string;
  resource_type?: string;
  alt?: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUNDED';

export type PaymentMethod = 'STRIPE' | 'RAZORPAY' | 'COD';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type CouponType = 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';

export interface IOrderItem {
  product: string;
  variant?: string;
  name: string;
  sku: string;
  color?: string;
  size?: string;
  image: string;
  price: number;
  quantity: number;
  total: number;
}
