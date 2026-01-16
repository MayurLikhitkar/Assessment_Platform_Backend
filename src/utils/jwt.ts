import jwt from 'jsonwebtoken';
import { JWT_REFRESH_SECRET, JWT_SECRET } from '../config/envConfig';

export interface TokenPayload {
    userId: number;
    email: string;
    role: string;
}

export const generateTokens = (payload: TokenPayload) => {
    const accessToken = jwt.sign(
        payload,
        JWT_SECRET,
        // { expiresIn: JWT_EXPIRE || '7d' }
        { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
        payload,
        JWT_REFRESH_SECRET,
        { expiresIn: '30d' }
        // { expiresIn: JWT_REFRESH_EXPIRE || '30d' }
    );

    return { accessToken, refreshToken };
};

export const verifyToken = (token: string, isRefreshToken = false) => {
    try {
        const secret = isRefreshToken
            ? JWT_REFRESH_SECRET
            : JWT_SECRET;

        return jwt.verify(token, secret as string) as TokenPayload;
    } catch (error) {
        return null;
    }
};