import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  submitReturnRequest
} from '../controllers/orderController';
import { optionalAuthenticate, authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/', optionalAuthenticate, createOrder);
router.get('/', authenticate, getOrders);
router.get('/:id', optionalAuthenticate, getOrderById);
router.patch('/:id/status', authenticate, requireAdmin, updateOrderStatus);
router.post('/returns', authenticate, submitReturnRequest);

export default router;
