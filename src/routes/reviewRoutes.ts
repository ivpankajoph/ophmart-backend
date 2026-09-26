import { Router } from 'express';
import { getReviews, createReview, moderateReview } from '../controllers/reviewController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getReviews);
router.post('/', authenticate, createReview);
router.patch('/:id/moderate', authenticate, requireAdmin, moderateReview);

export default router;
