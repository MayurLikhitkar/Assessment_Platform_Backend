import { hashPassword, comparePassword } from '../utils/bcrypt';
import { Request, Response } from 'express';
import userModel, { IUser } from '../models/userModel';
import { generateTokens, verifyToken } from '../utils/jwt';
import { HttpStatus, MESSAGE } from '../utils/constants';
import { CustomRequest, ChangePasswordRequest } from '../types/authTypes';
import { errorResponse, successResponse } from '../utils/responseHandler';

export const register = async (req: Request, res: Response) => {

    const { email, password, fullName, phone } = req.body as IUser;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
        return res.status(HttpStatus.CONFLICT).json(errorResponse(MESSAGE.ACCOUNT_ALREADY_EXISTS, 'User already exists'));
    }

    const hashedPassword = await hashPassword(password);

    const user = new userModel({
        email,
        password: hashedPassword,
        fullName,
        phone,
    });

    await user.save();

    return res.status(HttpStatus.CREATED).json(successResponse(MESSAGE.REGISTERED_SUCCESSFULLY, user));
};

export const login = async (req: Request, res: Response) => {

    const { email, password } = req.body as IUser;

    const user = await userModel.findOne({ email }).select('+password');
    if (!user) {
        return res.status(HttpStatus.BAD_REQUEST).json(errorResponse(MESSAGE.INVALID_CREDENTIALS, 'Account with this email not found'))
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
        return res.status(HttpStatus.BAD_REQUEST).json(errorResponse(MESSAGE.INVALID_CREDENTIALS, 'Invalid password'))
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const tokens = generateTokens({
        _id: user._id.toString(),
        userId: user.id,
        email: user.email,
        role: user.role,
    });

    if (!tokens) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(MESSAGE.SOMETHING_WENT_WRONG, 'Failed to generate tokens'));
    }

    const { password: _, ...userWithoutPassword } = user.toObject();

    return res.status(HttpStatus.OK).json(successResponse(MESSAGE.AUTHENTICATION_SUCCESS, { ...tokens, user: userWithoutPassword }));
};

export const logout = async (req: CustomRequest, res: Response) => {
    // In a real application, you might want to blacklist the token
    return res.status(HttpStatus.OK).json(successResponse(MESSAGE.LOGGED_OUT_SUCCESSFULLY));
};

export const refreshToken = async (req: Request, res: Response) => {
    const { refreshToken } = req.body as { refreshToken: string };

    if (!refreshToken) {
        return res.status(HttpStatus.BAD_REQUEST).json(errorResponse('Invalid Request', 'Refresh token is missing'));
    }

    const decoded = verifyToken(refreshToken, true);
    if (!decoded) {
        return res.status(HttpStatus.BAD_REQUEST).json(errorResponse('Invalid Request', 'Invalid refresh token'));
    }

    const user = await userModel.findById(decoded._id);
    if (!user) {
        return res.status(HttpStatus.BAD_REQUEST).json(errorResponse('Invalid Request', 'User not found'));
    }

    // Generate new tokens
    const tokens = generateTokens({
        _id: user._id.toString(),
        userId: user.id,
        email: user.email,
        role: user.role,
    });

    return res.status(HttpStatus.OK).json(successResponse(MESSAGE.AUTHENTICATION_SUCCESS, tokens));
};

export const getProfile = async (req: CustomRequest, res: Response) => {
    const { email } = req.user!;

    const user = await userModel.findOne({ email })
    // .select('-password');

    if (!user) {
        return res.status(HttpStatus.BAD_REQUEST).json(errorResponse('Account not found', 'Account not found'));
    }

    return res.status(HttpStatus.OK).json(successResponse('Account details fetched successfully', user));
};

export const updateProfile = async (req: CustomRequest, res: Response) => {
    const { fullName, phone, skills, experience } = req.body as IUser;
    const { email } = req.user!;

    const foundUser = await userModel.findOne({ email });
    if (!foundUser) {
        return res.status(HttpStatus.BAD_REQUEST).json(errorResponse('Account not found', 'Account not found'));
    }

    const updatedUser = await userModel.findOneAndUpdate(
        { email },
        {
            fullName,
            phone,
            skills,
            experience,
            updatedAt: new Date(),
        },
        { new: true, runValidators: true }
    ).select('-password');

    return res.status(HttpStatus.OK).json(successResponse('Account updated successfully', updatedUser));
};

export const changePassword = async (req: CustomRequest, res: Response) => {
    const { currentPassword, newPassword, confirmPassword } = req.body as ChangePasswordRequest;
    const { email } = req.user!;

    if (newPassword !== confirmPassword) {
        return res.status(HttpStatus.BAD_REQUEST).json(errorResponse('Password and Confirmed Password do not match', 'Password and Confirmed Password do not match'));
    }

    const foundUser = await userModel.findOne({ email }).select('+password');
    if (!foundUser) {
        return res.status(HttpStatus.BAD_REQUEST).json(errorResponse('Account not found', 'Account not found'));
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, foundUser.password);
    if (!isPasswordValid) {
        return res.status(HttpStatus.BAD_REQUEST).json(errorResponse('Wrong password', 'Invalid password'))
    }

    const hashedPassword = await hashPassword(newPassword);

    // Update password
    foundUser.password = hashedPassword;
    await foundUser.save();

    return res.status(HttpStatus.OK).json(successResponse('Password updated successfully'));
};

export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };

    const user = await userModel.findOne({ email });
    if (!user) {
        return res.status(HttpStatus.BAD_REQUEST).json(errorResponse('Account not found', 'Account not found'));
    }

    // Generate reset token (simplified)
    const resetToken = Math.random().toString(36).slice(2);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // In production, send email with reset link
    // await sendPasswordResetEmail(user.email, resetToken);

    return res.status(HttpStatus.OK).json(successResponse('Password reset link sent to your email'));
};

export const resetPassword = async (req: Request, res: Response) => {
    const { token, newPassword } = req.body as { token: string, newPassword: string };

    const user = await userModel.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
        return res.status(HttpStatus.BAD_REQUEST).json(errorResponse('Reset Link Expired or Invalid', 'Invalid or expired token'));
    }

    const hashedPassword = await hashPassword(newPassword);

    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(HttpStatus.OK).json(successResponse('Password reset successfully'));
};

export const getUsers = async (req: Request, res: Response) => {
    const users = await userModel.find().select('-password');
    res.status(HttpStatus.OK).json(successResponse('Users fetched successfully', users));
};
