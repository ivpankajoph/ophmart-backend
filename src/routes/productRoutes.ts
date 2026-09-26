import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  searchOverlayData,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getProducts);
router.get('/search/overlay', searchOverlayData);
router.get('/:slug', getProductBySlug);

// Admin product endpoints
router.post('/', authenticate, requireAdmin, createProduct);
router.patch('/:id', authenticate, requireAdmin, updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

export default router;
