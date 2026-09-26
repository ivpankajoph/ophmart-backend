import { Router } from 'express';
import { getBrands, getBrandBySlug, createBrand } from '../controllers/brandController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getBrands);
router.get('/:slug', getBrandBySlug);
router.post('/', authenticate, requireAdmin, createBrand);

export default router;
