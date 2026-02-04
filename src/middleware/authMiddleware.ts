import { Response, NextFunction } from 'express';
import userModel from '../models/userModel';
import { verifyToken } from '../utils/jwt';
import { httpStatus } from '../utils/constants';
import { AuthRequest } from '../types/authTypes';
import { errorResponse } from '../utils/responseHandler';

export const authenticate = async (
    request: AuthRequest,
    response: Response,
    next: NextFunction
) => {
    try {
        const authHeader = request.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            throw new Error('Invalid token format');
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            throw new Error('No token provided');
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            throw new Error('Invalid token');
        }

        const user = await userModel.findOne({ id: decoded.userId });
        if (!user) {
            throw new Error('User not found');
        }

        request.user = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        next();
    } catch (error) {
        console.error('authenticate error ====> ', error);
        if (error instanceof Error) {
            return response.status(httpStatus.UNAUTHORIZED).json(errorResponse('Authentication failed', error.message))
        }
        return response.status(httpStatus.UNAUTHORIZED).json(errorResponse('Authentication failed', 'Authentication error', error));
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            console.error('Unauthorized')
            return res.status(httpStatus.UNAUTHORIZED).json(errorResponse('Unauthorized', 'Payload Not Found'));
        }

        if (!roles.includes(req.user.role)) {
            console.error('Forbidden')
            return res.status(httpStatus.FORBIDDEN).json(errorResponse('Forbidden', 'Role Not Recognized'));
        }

        next();
    };
};