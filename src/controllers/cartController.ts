import { Response, NextFunction } from 'express';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { ProductVariant } from '../models/ProductVariant';
import { Coupon } from '../models/Coupon';
import { AuthenticatedRequest } from '../middleware/auth';
import { AnalyticsService } from '../services/analytics';

const calculateCartTotals = async (cart: any) => {
  let subtotal = 0;
  for (const item of cart.items) {
    subtotal += item.price * item.quantity;
  }

  let discount = 0;
  if (cart.coupon) {
    const couponDoc = await Coupon.findById(cart.coupon);
    if (couponDoc && couponDoc.status === 'ACTIVE' && new Date() <= couponDoc.endDate) {
      if (subtotal >= couponDoc.minimumPurchase) {
        if (couponDoc.type === 'PERCENTAGE') {
          discount = Math.round((subtotal * couponDoc.value) / 100);
          if (couponDoc.maximumDiscount && discount > couponDoc.maximumDiscount) {
            discount = couponDoc.maximumDiscount;
          }
        } else if (couponDoc.type === 'FIXED') {
          discount = Math.min(couponDoc.value, subtotal);
        }
      }
    }
  }

  const shipping = subtotal > 5000 || subtotal === 0 ? 0 : 499;
  const giftWrapCost = cart.giftWrap ? 250 : 0;
  const tax = Math.round((subtotal - discount) * 0.18); // 18% GST standard luxury
  const total = Math.max(0, subtotal - discount + shipping + giftWrapCost);

  return {
    subtotal,
    discount,
    shipping,
    giftWrapCost,
    tax,
    total
  };
};

export const getCart = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const guestId = (req.query.guestId as string) || (req.headers['x-guest-id'] as string);

    if (!userId && !guestId) {
      res.status(200).json({
        success: true,
        data: {
          items: [],
          totals: { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0 }
        }
      });
      return;
    }

    let cart = await Cart.findOne(userId ? { user: userId } : { guestId })
      .populate('items.product', 'name slug images price compareAtPrice inventory')
      .populate('items.variant')
      .populate('coupon');

    if (!cart) {
      cart = await Cart.create(userId ? { user: userId, items: [] } : { guestId, items: [] });
    }

    const totals = await calculateCartTotals(cart);

    res.status(200).json({
      success: true,
      data: {
        cart,
        totals
      }
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { guestId, productId, variantId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
      return;
    }

    let variant = null;
    if (variantId) {
      variant = await ProductVariant.findById(variantId);
    }

    let cart = await Cart.findOne(userId ? { user: userId } : { guestId });
    if (!cart) {
      cart = new Cart(userId ? { user: userId, items: [] } : { guestId, items: [] });
    }

    const sku = variant ? variant.sku : product.sku;
    const price = variant ? (variant.salePrice || variant.price) : (product.salePrice || product.price);
    const color = variant ? variant.color : (product.colors?.[0] || 'Standard');
    const size = variant ? variant.size : (product.sizes?.[0] || 'Standard');
    const image = variant?.images?.[0]?.secure_url || product.images?.[0]?.secure_url || '';

    const existingIndex = cart.items.findIndex(
      item => item.product.toString() === productId && (!variantId || item.variant?.toString() === variantId)
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += Number(quantity);
    } else {
      cart.items.push({
        product: product._id as any,
        variant: variant ? (variant._id as any) : undefined,
        sku,
        name: product.name,
        color,
        size,
        image,
        price,
        quantity: Number(quantity)
      });
    }

    await cart.save();
    const totals = await calculateCartTotals(cart);

    AnalyticsService.track('add_to_cart', {
      productId: product._id,
      name: product.name,
      price,
      quantity
    }, userId);

    res.status(200).json({
      success: true,
      message: 'Item added to bag',
      data: {
        cart,
        totals
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { itemId } = req.params;
    const { quantity, guestId } = req.body;

    const cart = await Cart.findOne(userId ? { user: userId } : { guestId });
    if (!cart) {
      res.status(404).json({ success: false, message: 'Cart not found', code: 'CART_NOT_FOUND' });
      return;
    }

    const item = cart.items.find(i => i._id?.toString() === itemId);
    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found in cart', code: 'ITEM_NOT_FOUND' });
      return;
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter(i => i._id?.toString() !== itemId);
    } else {
      item.quantity = Number(quantity);
    }

    await cart.save();
    const totals = await calculateCartTotals(cart);

    res.status(200).json({
      success: true,
      data: {
        cart,
        totals
      }
    });
  } catch (error) {
    next(error);
  }
};

export const removeCartItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { itemId } = req.params;
    const { guestId } = req.query;

    const cart = await Cart.findOne(userId ? { user: userId } : { guestId });
    if (!cart) {
      res.status(404).json({ success: false, message: 'Cart not found', code: 'CART_NOT_FOUND' });
      return;
    }

    cart.items = cart.items.filter(i => i._id?.toString() !== itemId);
    await cart.save();
    const totals = await calculateCartTotals(cart);

    res.status(200).json({
      success: true,
      message: 'Item removed from bag',
      data: { cart, totals }
    });
  } catch (error) {
    next(error);
  }
};

export const applyCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { code, guestId } = req.body;

    const cart = await Cart.findOne(userId ? { user: userId } : { guestId });
    if (!cart) {
      res.status(404).json({ success: false, message: 'Cart not found', code: 'CART_NOT_FOUND' });
      return;
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), status: 'ACTIVE' });
    if (!coupon || new Date() > coupon.endDate) {
      res.status(400).json({ success: false, message: 'Invalid or expired promo code', code: 'COUPON_INVALID' });
      return;
    }

    cart.coupon = coupon._id as any;
    await cart.save();
    const totals = await calculateCartTotals(cart);

    res.status(200).json({
      success: true,
      message: `Coupon ${coupon.code} applied!`,
      data: { cart, totals }
    });
  } catch (error) {
    next(error);
  }
};

export const toggleGiftWrap = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { guestId, giftWrap, giftMessage } = req.body;

    const cart = await Cart.findOne(userId ? { user: userId } : { guestId });
    if (!cart) {
      res.status(404).json({ success: false, message: 'Cart not found', code: 'CART_NOT_FOUND' });
      return;
    }

    cart.giftWrap = typeof giftWrap === 'boolean' ? giftWrap : !cart.giftWrap;
    if (giftMessage !== undefined) cart.giftMessage = giftMessage;

    await cart.save();
    const totals = await calculateCartTotals(cart);

    res.status(200).json({
      success: true,
      data: { cart, totals }
    });
  } catch (error) {
    next(error);
  }
};

export const syncGuestCart = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized', code: 'UNAUTHORIZED' });
      return;
    }

    const { guestId, guestItems = [] } = req.body;
    let userCart = await Cart.findOne({ user: userId });
    if (!userCart) {
      userCart = new Cart({ user: userId, items: [] });
    }

    // Merge items from guestItems
    for (const gItem of guestItems) {
      const existing = userCart.items.find(
        i => i.product.toString() === gItem.productId && (!gItem.variantId || i.variant?.toString() === gItem.variantId)
      );

      if (existing) {
        existing.quantity += gItem.quantity || 1;
      } else {
        const prod = await Product.findById(gItem.productId);
        if (prod) {
          userCart.items.push({
            product: prod._id as any,
            variant: gItem.variantId || undefined,
            sku: gItem.sku || prod.sku,
            name: prod.name,
            color: gItem.color || prod.colors?.[0],
            size: gItem.size || prod.sizes?.[0],
            image: gItem.image || prod.images?.[0]?.secure_url || '',
            price: gItem.price || prod.price,
            quantity: gItem.quantity || 1
          });
        }
      }
    }

    // Clean guest cart if exists
    if (guestId) {
      await Cart.deleteOne({ guestId });
    }

    await userCart.save();
    const totals = await calculateCartTotals(userCart);

    res.status(200).json({
      success: true,
      message: 'Cart synchronized',
      data: { cart: userCart, totals }
    });
  } catch (error) {
    next(error);
  }
};
