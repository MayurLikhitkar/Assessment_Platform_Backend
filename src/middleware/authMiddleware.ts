import { Response, NextFunction } from 'express';
import userModel from '../models/userModel';
import { verifyToken } from '../utils/jwt';
import { HttpStatus } from '../utils/constants';
import { CustomRequest } from '../types/authTypes';
import { errorResponse } from '../utils/responseHandler';
import logger from '../utils/logger';

export const authenticate = async (
    request: CustomRequest,
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

        const user = await userModel.findById(decoded._id);
        if (!user) {
            throw new Error('User not found');
        }

        request.user = {
            _id: user._id.toString(),
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        next();
    } catch (error) {
        if (error instanceof Error) {
            return response.status(HttpStatus.UNAUTHORIZED).json(errorResponse('Authentication failed', error.message, error))
        }
        return response.status(HttpStatus.UNAUTHORIZED).json(errorResponse('Authentication failed', 'Authentication error', error));
    }
};

export const authorize = (...roles: string[]) => {
    return (req: CustomRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            logger.warn('Unauthorized: missing user payload');
            return res.status(HttpStatus.UNAUTHORIZED).json(errorResponse('Unauthorized', 'Payload Not Found'));
        }

        if (!roles.includes(req.user.role)) {
            logger.warn(`Forbidden: role "${req.user.role}" not in [${roles.join(', ')}]`);
            return res.status(HttpStatus.FORBIDDEN).json(errorResponse('Forbidden', 'Role Not Recognized'));
        }

        next();
    };
};