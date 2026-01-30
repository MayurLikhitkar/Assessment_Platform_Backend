import { hashPassword } from './../utils/bcrypt';
import { Request, Response } from 'express';
import userModel, { IUser } from '../models/userModel';
import { generateTokens } from '../utils/jwt';
import { AuthRequest } from '../middleware/authMiddleware';
import { httpStatus, MESSAGE } from '../utils/constants';

export const register = async (req: Request, res: Response) => {
    const { email, password, fullName, phone } = req.body as IUser;
    console.log('first', req.body)
    // Check if user exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
        return res.status(httpStatus.CONFLICT).json({ message: MESSAGE.ACCOUNT_ALREADY_EXISTS });
    }

    const hashedPassword = await hashPassword(password);

    // Create user
    const user = new userModel({
        email,
        password: hashedPassword,
        fullName,
        phone,
    });

    await user.save();

    // Generate tokens
    const tokens = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
    });

    return res.status(httpStatus.CREATED).json(tokens);
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body as { email: string, password: string };

    // Find user
    const user = await userModel.findOne({ email });
    if (!user) {
        return res.status(httpStatus.NOT_FOUND).json({ message: MESSAGE.INVALID_CREDENTIALS });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokens = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
    });
    console.log('tokens====>', password)
    return res.json({ ...tokens, });
};

export const logout = async (req: AuthRequest, res: Response) => {
    // In a real application, you might want to blacklist the token
    return res.json({ message: MESSAGE.LOGGED_OUT_SUCCESSFULLY });
};

// export const refreshToken = async (req: Request, res: Response) => {
//     try {
//         const { refreshToken } = req.body;

//         if (!refreshToken) {
//             return res.status(httpStatus.BAD_REQUEST).json({ message: 'Refresh token required' });
//         }

//         const decoded = verifyToken(refreshToken, true);
//         if (!decoded) {
//             return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Invalid refresh token' });
//         }

//         const user = await userModel.findOne({ userId: decoded.userId });
//         if (!user) {
//             return res.status(httpStatus.NOT_FOUND).json({ message: 'User not found' });
//         }

//         // Generate new tokens
//         const tokens = generateTokens({
//             userId: user.userId,
//             email: user.email,
//             role: user.role,
//         });

//         res.json(tokens);
//     } catch (error: any) {
//         res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Server error', error: error.message });
//     }
// };

// export const getProfile = async (req: AuthRequest, res: Response) => {
//     try {
//         const user = await userModel.findOne({ userId: req.user?.userId })
//             .select('-password');

//         if (!user) {
//             return res.status(httpStatus.NOT_FOUND).json({ message: 'User not found' });
//         }

//         res.json(user);
//     } catch (error: any) {
//         res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Server error', error: error.message });
//     }
// };

// export const updateProfile = async (req: AuthRequest, res: Response) => {
//     try {
//         const { firstName, lastName, phone, skills, experience } = req.body;
//         const user = req.user;

//         const updatedUser = await userModel.findOneAndUpdate(
//             { userId: user?.userId },
//             {
//                 firstName,
//                 lastName,
//                 phone,
//                 skills,
//                 experience,
//                 updatedAt: new Date(),
//             },
//             { new: true, runValidators: true }
//         ).select('-password');

//         res.json(updatedUser);
//     } catch (error: any) {
//         res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Server error', error: error.message });
//     }
// };

// export const changePassword = async (req: AuthRequest, res: Response) => {
//     try {
//         const { currentPassword, newPassword } = req.body;
//         const user = req.user;

//         const foundUser = await userModel.findOne({ userId: user?.userId });
//         if (!foundUser) {
//             return res.status(httpStatus.NOT_FOUND).json({ message: 'User not found' });
//         }

//         // Verify current password
//         const isValid = await foundUser.comparePassword(currentPassword);
//         if (!isValid) {
//             return res.status(httpStatus.BAD_REQUEST).json({ message: 'Current password is incorrect' });
//         }

//         // Update password
//         foundUser.password = newPassword;
//         await foundUser.save();

//         res.json({ message: 'Password updated successfully' });
//     } catch (error: any) {
//         res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Server error', error: error.message });
//     }
// };

// export const forgotPassword = async (req: Request, res: Response) => {
//     try {
//         const { email } = req.body;

//         const user = await userModel.findOne({ email });
//         if (!user) {
//             return res.status(httpStatus.NOT_FOUND).json({ message: 'User not found' });
//         }

//         // Generate reset token (simplified)
//         const resetToken = Math.random().toString(36).slice(2);
//         const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

//         user.resetPasswordToken = resetToken;
//         user.resetPasswordExpires = resetTokenExpiry;
//         await user.save();

//         // In production, send email with reset link
//         // await sendPasswordResetEmail(user.email, resetToken);

//         res.json({ message: 'Password reset email sent' });
//     } catch (error: any) {
//         res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Server error', error: error.message });
//     }
// };

// export const resetPassword = async (req: Request, res: Response) => {
//     try {
//         const { token, newPassword } = req.body;

//         const user = await userModel.findOne({
//             resetPasswordToken: token,
//             resetPasswordExpires: { $gt: new Date() },
//         });

//         if (!user) {
//             return res.status(httpStatus.BAD_REQUEST).json({ message: 'Invalid or expired token' });
//         }

//         user.password = newPassword;
//         user.resetPasswordToken = undefined;
//         user.resetPasswordExpires = undefined;
//         await user.save();

//         res.json({ message: 'Password reset successful' });
//     } catch (error: any) {
//         res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Server error', error: error.message });
//     }
// };