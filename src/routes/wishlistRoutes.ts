import { Router } from 'express';
import { getWishlist, toggleWishlist, syncWishlist } from '../controllers/wishlistController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getWishlist);
router.post('/toggle', authenticate, toggleWishlist);
router.post('/sync', authenticate, syncWishlist);

export default router;
