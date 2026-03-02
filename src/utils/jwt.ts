import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { JWT_REFRESH_SECRET, JWT_SECRET } from '../config/envConfig';
import { TokenPayload } from '../types/authTypes';
import logger from './logger';

export const generateTokens = (payload: TokenPayload) => {
    try {
        const accessToken = jwt.sign(
            payload,
            JWT_SECRET,
            // { expiresIn: JWT_EXPIRE || '7d' }
            { expiresIn: '24h' }
        );

        const refreshToken = jwt.sign(
            payload,
            JWT_REFRESH_SECRET,
            { expiresIn: '2d' }
            // { expiresIn: JWT_REFRESH_EXPIRE || '30d' }
        );

        return { accessToken, refreshToken };
    } catch (error) {
        logger.error('JWT Error: Error generating tokens', { error });
        return null;
    }
};

export const verifyToken = (token: string, isRefreshToken = false) => {
    try {
        const secret = isRefreshToken
            ? JWT_REFRESH_SECRET
            : JWT_SECRET;

        return jwt.verify(token, secret) as TokenPayload;
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            logger.warn('JWT Error: Token expired');
        } else if (error instanceof JsonWebTokenError) {
            logger.warn('JWT Error: Invalid token signature/format');
        } else {
            logger.error('JWT Error', { error });
        }
        return null;
    }
};