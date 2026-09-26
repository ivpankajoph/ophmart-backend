import { Request, Response, NextFunction } from 'express';
import { Review } from '../models/Review';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { AuthenticatedRequest } from '../middleware/auth';

export const getReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId, page = 1, limit = 10 } = req.query;
    if (!productId) {
      res.status(400).json({ success: false, message: 'ProductId is required', code: 'PARAM_MISSING' });
      return;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total, allReviews] = await Promise.all([
      Review.find({ product: productId, status: 'APPROVED' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments({ product: productId, status: 'APPROVED' }),
      Review.find({ product: productId, status: 'APPROVED' }).select('rating').lean()
    ]);

    // Calculate rating distribution
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let ratingSum = 0;
    allReviews.forEach(r => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      breakdown[star] += 1;
      ratingSum += r.rating;
    });

    const averageRating = allReviews.length > 0 ? Number((ratingSum / allReviews.length).toFixed(1)) : 5.0;

    res.status(200).json({
      success: true,
      data: {
        reviews,
        breakdown,
        averageRating,
        total,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized', code: 'UNAUTHORIZED' });
      return;
    }

    const { productId, rating, title, comment, images = [] } = req.body;
    if (!productId || !rating || !title || !comment) {
      res.status(400).json({ success: false, message: 'All review fields are required', code: 'VALIDATION_ERROR' });
      return;
    }

    // Check if user purchased the product
    const orderWithItem = await Order.findOne({
      user: userId,
      'items.product': productId,
      orderStatus: 'DELIVERED'
    });

    const review = await Review.create({
      product: productId,
      user: userId,
      userName: `${req.user?.email.split('@')[0]}`,
      rating: Number(rating),
      title,
      comment,
      images,
      verifiedPurchase: !!orderWithItem,
      status: 'APPROVED'
    });

    // Update product ratings and reviews count
    const allProdReviews = await Review.find({ product: productId, status: 'APPROVED' });
    const avg = allProdReviews.reduce((acc, r) => acc + r.rating, 0) / allProdReviews.length;
    await Product.findByIdAndUpdate(productId, {
      ratings: Number(avg.toFixed(1)),
      reviewsCount: allProdReviews.length
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

export const moderateReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const review = await Review.findByIdAndUpdate(id, { status }, { new: true });
    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found', code: 'NOT_FOUND' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Review status updated to ${status}`,
      data: review
    });
  } catch (error) {
    next(error);
  }
};
