import { Router } from 'express';
import {
  getDashboardStats,
  getInventory,
  updateVariantStock,
  getCustomers,
  toggleCustomerStatus,
  getBanners,
  createBanner,
  updateBanner
} from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Dashboard & Analytics
router.get('/dashboard', authenticate, requireAdmin, getDashboardStats);
router.get('/inventory', authenticate, requireAdmin, getInventory);
router.patch('/inventory/variants/:variantId', authenticate, requireAdmin, updateVariantStock);

// Customers
router.get('/customers', authenticate, requireAdmin, getCustomers);
router.patch('/customers/:id/status', authenticate, requireAdmin, toggleCustomerStatus);

// Banners (CMS)
router.get('/banners', getBanners);
router.post('/banners', authenticate, requireAdmin, createBanner);
router.patch('/banners/:id', authenticate, requireAdmin, updateBanner);

export default router;
