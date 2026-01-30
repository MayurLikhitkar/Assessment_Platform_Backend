import express from 'express';
import {
    register,
    login,
    logout,
    // refreshToken,
    // forgotPassword,
    // resetPassword,
    // getProfile,
    // updateProfile,
    // changePassword,
} from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { loginValidation, registerValidation } from '../controllers/validations/authValidation';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Routes
router.post('/register', registerValidation, asyncHandler(register));
router.post('/login', loginValidation, asyncHandler(login));
router.post('/logout', authenticate, asyncHandler(logout));
// router.post('/refresh', refreshToken);
// router.post('/forgot-password', forgotPassword);
// router.post('/reset-password', resetPassword);

// // Protected routes
// router.get('/profile', authenticate, getProfile);
// router.put('/profile', authenticate, updateProfile);
// router.put('/change-password', authenticate, changePassword);

export default router;