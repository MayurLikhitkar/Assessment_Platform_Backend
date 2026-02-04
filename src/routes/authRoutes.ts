import express from 'express';
import {
    registerController,
    loginController,
    logoutController,
} from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { loginValidation, registerValidation } from '../validations/authValidation';

const router = express.Router();

// Routes
router.post('/register', registerValidation, asyncHandler(registerController));
router.post('/login', loginValidation, asyncHandler(loginController));
router.use(authenticate);
router.post('/logout', asyncHandler(logoutController));
// router.post('/refresh', refreshToken);
// router.post('/forgot-password', forgotPassword);
// router.post('/reset-password', resetPassword);

// // Protected routes
// router.get('/profile', authenticate, getProfile);
// router.put('/profile', authenticate, updateProfile);
// router.put('/change-password', authenticate, changePassword);

export default router;