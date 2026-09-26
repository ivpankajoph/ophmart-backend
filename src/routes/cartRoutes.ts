import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  applyCoupon,
  toggleGiftWrap,
  syncGuestCart
} from '../controllers/cartController';
import { optionalAuthenticate, authenticate } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuthenticate, getCart);
router.post('/items', optionalAuthenticate, addToCart);
router.patch('/items/:itemId', optionalAuthenticate, updateCartItem);
router.delete('/items/:itemId', optionalAuthenticate, removeCartItem);
router.post('/coupon', optionalAuthenticate, applyCoupon);
router.post('/gift-wrap', optionalAuthenticate, toggleGiftWrap);
router.post('/sync', authenticate, syncGuestCart);

export default router;
