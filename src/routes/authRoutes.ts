import express from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { loginValidation, registerValidation } from '../validations/authValidation';
import { changePassword, forgotPassword, getProfile, getUsers, login, logout, refreshToken, register, resetPassword, updateProfile } from '../controllers/authController';
import validatePayload from '../middleware/validatePayload';

const router = express.Router();

// Routes
router.post('/register', registerValidation, asyncHandler(register));
router.post('/login', loginValidation, asyncHandler(login));
router.post('/logout', authenticate, asyncHandler(logout));
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.use(authenticate);
router.use(validatePayload);
router.get('/profile', asyncHandler(getProfile));
router.put('/profile', asyncHandler(updateProfile));
router.put('/change-password', asyncHandler(changePassword));
router.get('/users', asyncHandler(getUsers));

export default router;