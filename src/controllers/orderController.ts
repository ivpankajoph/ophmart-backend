import { Response, NextFunction } from 'express';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { ProductVariant } from '../models/ProductVariant';
import { Coupon } from '../models/Coupon';
import { Cart } from '../models/Cart';
import { ReturnRequest } from '../models/ReturnRequest';
import { PaymentService } from '../services/payment';
import { AnalyticsService } from '../services/analytics';
import { AuthenticatedRequest } from '../middleware/auth';

const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `OPH-${timestamp}-${random}`;
};

export const createOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const {
      guestEmail,
      items,
      shippingAddress,
      billingAddress,
      paymentMethod = 'COD',
      couponCode,
      giftWrap = false,
      notes
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Order must contain at least one item', code: 'EMPTY_ORDER' });
      return;
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.addressLine1 || !shippingAddress.city) {
      res.status(400).json({ success: false, message: 'Valid shipping address is required', code: 'INVALID_ADDRESS' });
      return;
    }

    // Backend price recalculation & inventory check
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId || item.product);
      if (!product || product.status !== 'PUBLISHED') {
        res.status(400).json({
          success: false,
          message: `Product ${item.name || 'item'} is no longer available`,
          code: 'PRODUCT_UNAVAILABLE'
        });
        return;
      }

      let price = product.salePrice || product.price;
      let sku = product.sku;
      let variantDoc = null;

      if (item.variantId || item.variant) {
        variantDoc = await ProductVariant.findById(item.variantId || item.variant);
        if (variantDoc) {
          if (variantDoc.stock < item.quantity) {
            res.status(400).json({
              success: false,
              message: `Insufficient stock for ${product.name} (${variantDoc.color} / ${variantDoc.size})`,
              code: 'OUT_OF_STOCK'
            });
            return;
          }
          price = variantDoc.salePrice || variantDoc.price;
          sku = variantDoc.sku;
        }
      } else {
        if (product.inventory < item.quantity) {
          res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}`,
            code: 'OUT_OF_STOCK'
          });
          return;
        }
      }

      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        product: product._id as any,
        variant: variantDoc ? (variantDoc._id as any) : undefined,
        sku,
        name: product.name,
        color: item.color || (variantDoc ? variantDoc.color : product.colors?.[0]),
        size: item.size || (variantDoc ? variantDoc.size : product.sizes?.[0]),
        image: item.image || product.images?.[0]?.secure_url || '',
        price,
        quantity: item.quantity,
        total: itemTotal
      });
    }

    // Coupon discount recalculation
    let discount = 0;
    let couponDoc = null;
    if (couponCode) {
      couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase(), status: 'ACTIVE' });
      if (couponDoc && new Date() <= couponDoc.endDate && subtotal >= couponDoc.minimumPurchase) {
        if (couponDoc.type === 'PERCENTAGE') {
          discount = Math.round((subtotal * couponDoc.value) / 100);
          if (couponDoc.maximumDiscount && discount > couponDoc.maximumDiscount) {
            discount = couponDoc.maximumDiscount;
          }
        } else if (couponDoc.type === 'FIXED') {
          discount = Math.min(couponDoc.value, subtotal);
        }
        couponDoc.usedCount += 1;
        await couponDoc.save();
      }
    }

    const shipping = subtotal > 5000 ? 0 : 499;
    const giftWrapFee = giftWrap ? 250 : 0;
    const tax = Math.round((subtotal - discount) * 0.18);
    const total = Math.max(0, subtotal - discount + shipping + giftWrapFee);

    const orderNumber = generateOrderNumber();

    // Safely decrement inventory
    for (const item of validatedItems) {
      if (item.variant) {
        await ProductVariant.findByIdAndUpdate(item.variant, {
          $inc: { stock: -item.quantity }
        });
      }
      await Product.findByIdAndUpdate(item.product, {
        $inc: { inventory: -item.quantity }
      });
    }

    // Initialize payment intent
    const paymentIntent = await PaymentService.createPaymentIntent(
      total,
      'INR',
      paymentMethod,
      orderNumber,
      userId ? undefined : guestEmail
    );

    const order = await Order.create({
      orderNumber,
      user: userId ? (userId as any) : undefined,
      guestEmail: !userId ? guestEmail : undefined,
      items: validatedItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID', // In production mock is considered confirmed/paid
      paymentDetails: {
        transactionId: paymentIntent.transactionId,
        provider: paymentMethod,
        paidAt: paymentMethod !== 'COD' ? new Date() : undefined
      },
      orderStatus: 'CONFIRMED',
      statusHistory: [
        {
          status: 'CONFIRMED',
          timestamp: new Date(),
          note: 'Order confirmed and placed successfully'
        }
      ],
      subtotal,
      discount,
      shipping,
      tax,
      total,
      coupon: couponDoc ? couponDoc._id : undefined,
      couponCode: couponDoc ? couponDoc.code : undefined,
      trackingNumber: `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`,
      carrier: 'BlueDart Express Luxury',
      estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 business days
      giftWrap
    });

    // Clear user's cart if authenticated
    if (userId) {
      await Cart.findOneAndUpdate({ user: userId }, { items: [], coupon: null, giftWrap: false });
    }

    AnalyticsService.track('purchase', {
      orderNumber: order.orderNumber,
      total,
      itemCount: validatedItems.length
    }, userId);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order,
        paymentIntent
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const query: any = {};

    // If regular customer, show only their orders
    if (req.user?.role === 'CUSTOMER') {
      query.user = userId;
    } else if (req.query.user) {
      query.user = req.query.user;
    }

    if (req.query.status) {
      query.orderStatus = req.query.status;
    }

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Number(req.query.limit || 10));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'firstName lastName email').lean(),
      Order.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { orderNumber: id }]
    }).populate('user', 'firstName lastName email phone');

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found', code: 'ORDER_NOT_FOUND' });
      return;
    }

    // Permission check
    if (req.user?.role === 'CUSTOMER' && order.user?._id?.toString() !== req.user.userId) {
      res.status(403).json({ success: false, message: 'Forbidden', code: 'FORBIDDEN' });
      return;
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note, trackingNumber, carrier } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found', code: 'ORDER_NOT_FOUND' });
      return;
    }

    order.orderStatus = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (carrier) order.carrier = carrier;

    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Order status updated to ${status}`
    });

    if (status === 'DELIVERED') {
      order.paymentStatus = 'PAID';
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const submitReturnRequest = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized', code: 'UNAUTHORIZED' });
      return;
    }

    const { orderId, productId, variantId, reason, description, images = [] } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found', code: 'ORDER_NOT_FOUND' });
      return;
    }

    const item = order.items.find(i => i.product.toString() === productId);
    if (!item) {
      res.status(400).json({ success: false, message: 'Item not in order', code: 'INVALID_ITEM' });
      return;
    }

    const returnReq = await ReturnRequest.create({
      order: order._id,
      user: userId,
      product: productId,
      variant: variantId,
      reason,
      description,
      images,
      status: 'PENDING',
      refundAmount: item.total
    });

    order.orderStatus = 'RETURN_REQUESTED';
    order.statusHistory.push({
      status: 'RETURN_REQUESTED',
      timestamp: new Date(),
      note: `Return requested for ${item.name}: ${reason}`
    });
    await order.save();

    res.status(201).json({
      success: true,
      message: 'Return request submitted successfully. Our team will review within 24-48 hours.',
      data: returnReq
    });
  } catch (error) {
    next(error);
  }
};
