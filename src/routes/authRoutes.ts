import { Router } from 'express';
import { register, login, getMe, updateProfile, manageAddress, refreshToken } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, updateProfile);
router.post('/addresses', authenticate, manageAddress);

export default router;
