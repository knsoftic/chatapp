import { Router } from 'express';
import { sendOtp, verifyOtp, register, refreshToken, logout } from '../controllers/authController';
import { otpRateLimiter } from '../middleware/rateLimiter';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/send-otp', otpRateLimiter, sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', register);
router.post('/refresh', refreshToken);
router.post('/logout', authMiddleware, logout);

export default router;
