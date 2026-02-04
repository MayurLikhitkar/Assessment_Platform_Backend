import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { JWT_REFRESH_SECRET, JWT_SECRET } from '../config/envConfig';
import { TokenPayload } from '../types/authTypes';

export const generateTokens = (payload: TokenPayload) => {
    try {
        const accessToken = jwt.sign(
            payload,
            JWT_SECRET,
            // { expiresIn: JWT_EXPIRE || '7d' }
            { expiresIn: '6h' }
        );

        const refreshToken = jwt.sign(
            payload,
            JWT_REFRESH_SECRET,
            { expiresIn: '2d' }
            // { expiresIn: JWT_REFRESH_EXPIRE || '30d' }
        );

        return { accessToken, refreshToken };
    } catch (error) {
        console.error('JWT Error: Error generating tokens', error);
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
            console.error('JWT Error: Token expired');
        } else if (error instanceof JsonWebTokenError) {
            console.error('JWT Error: Invalid token signature/format');
        } else {
            console.error('JWT Error:', error);
        }
        return null;
    }
};