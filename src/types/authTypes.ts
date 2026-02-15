import { Request } from "express";

export interface TokenPayload {
    userId: number;
    email: string;
    role: string;
}

export interface AuthRequest extends Request {
    user?: TokenPayload;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}