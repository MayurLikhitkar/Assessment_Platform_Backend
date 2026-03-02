import { Request } from "express";

export interface TokenPayload {
    _id: string;
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