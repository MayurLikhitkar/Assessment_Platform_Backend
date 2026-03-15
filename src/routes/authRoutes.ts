import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { loginValidation, addUserValidation, registerValidation } from '../validations/authValidation';
import { changePassword, forgotPassword, getProfile, getUsers, login, logout, refreshToken, register, resetPassword, updateProfile } from '../controllers/authController';
import validatePayload from '../middleware/validatePayload';
import { UserRole } from '../models/userModel';

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

// Admin routes
router.get('/users', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), asyncHandler(getUsers));
router.post('/addUser', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), addUserValidation, asyncHandler(register));


export default router;