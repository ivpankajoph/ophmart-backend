import { Request, Response, NextFunction } from 'express';
import { Coupon } from '../models/Coupon';
import { AuthenticatedRequest } from '../middleware/auth';

export const validateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, amount = 0 } = req.body;
    if (!code) {
      res.status(400).json({ success: false, message: 'Coupon code required', code: 'PARAM_MISSING' });
      return;
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), status: 'ACTIVE' });
    if (!coupon) {
      res.status(404).json({ success: false, message: 'Invalid promo code', code: 'INVALID_CODE' });
      return;
    }

    if (new Date() > coupon.endDate) {
      res.status(400).json({ success: false, message: 'This promo code has expired', code: 'COUPON_EXPIRED' });
      return;
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      res.status(400).json({ success: false, message: 'Coupon usage limit reached', code: 'LIMIT_EXCEEDED' });
      return;
    }

    if (amount < coupon.minimumPurchase) {
      res.status(400).json({
        success: false,
        message: `Minimum purchase of ₹${coupon.minimumPurchase.toLocaleString()} required for this code`,
        code: 'MIN_PURCHASE_NOT_MET'
      });
      return;
    }

    let calculatedDiscount = 0;
    if (coupon.type === 'PERCENTAGE') {
      calculatedDiscount = Math.round((amount * coupon.value) / 100);
      if (coupon.maximumDiscount && calculatedDiscount > coupon.maximumDiscount) {
        calculatedDiscount = coupon.maximumDiscount;
      }
    } else if (coupon.type === 'FIXED') {
      calculatedDiscount = Math.min(coupon.value, amount);
    }

    res.status(200).json({
      success: true,
      message: 'Coupon is valid',
      data: {
        coupon,
        discount: calculatedDiscount
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCoupons = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, type, value, minimumPurchase, maximumDiscount, usageLimit, endDate } = req.body;

    const exists = await Coupon.findOne({ code: code.toUpperCase() });
    if (exists) {
      res.status(400).json({ success: false, message: 'Coupon code already exists', code: 'DUPLICATE_CODE' });
      return;
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      type,
      value,
      minimumPurchase: minimumPurchase || 0,
      maximumDiscount,
      usageLimit,
      endDate: new Date(endDate)
    });

    res.status(201).json({ success: true, message: 'Coupon created successfully', data: coupon });
  } catch (error) {
    next(error);
  }
};
