import { Router } from 'express';
import { validateCoupon, getCoupons, createCoupon } from '../controllers/couponController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/validate', validateCoupon);
router.get('/', authenticate, requireAdmin, getCoupons);
router.post('/', authenticate, requireAdmin, createCoupon);

export default router;
