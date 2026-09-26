import { Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { AuthenticatedRequest } from '../middleware/auth';
import { AnalyticsService } from '../services/analytics';

export const getWishlist = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized', code: 'UNAUTHORIZED' });
      return;
    }

    const user = await User.findById(userId).populate({
      path: 'wishlist',
      populate: [{ path: 'brand', select: 'name slug' }, { path: 'variants' }]
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found', code: 'NOT_FOUND' });
      return;
    }

    res.status(200).json({
      success: true,
      data: user.wishlist
    });
  } catch (error) {
    next(error);
  }
};

export const toggleWishlist = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized', code: 'UNAUTHORIZED' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found', code: 'NOT_FOUND' });
      return;
    }

    const index = user.wishlist.findIndex(id => id.toString() === productId);
    let added = false;

    if (index > -1) {
      user.wishlist.splice(index, 1);
      AnalyticsService.track('wishlist_remove', { productId }, userId);
    } else {
      user.wishlist.push(productId as any);
      added = true;
      AnalyticsService.track('wishlist_add', { productId }, userId);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: added ? 'Added to wishlist' : 'Removed from wishlist',
      data: {
        added,
        wishlistIds: user.wishlist
      }
    });
  } catch (error) {
    next(error);
  }
};

export const syncWishlist = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { productIds = [] } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized', code: 'UNAUTHORIZED' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found', code: 'NOT_FOUND' });
      return;
    }

    for (const pId of productIds) {
      if (!user.wishlist.some(id => id.toString() === pId)) {
        user.wishlist.push(pId as any);
      }
    }

    await user.save();

    const populated = await User.findById(userId).populate({
      path: 'wishlist',
      populate: [{ path: 'brand', select: 'name slug' }]
    });

    res.status(200).json({
      success: true,
      message: 'Wishlist synchronized',
      data: populated?.wishlist
    });
  } catch (error) {
    next(error);
  }
};
