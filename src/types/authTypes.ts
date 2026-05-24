import { Request } from "express";
import { UserRole } from "../models/userModel";

export interface TokenPayload {
    _id: string;
    userId: number;
    email: string;
    role: UserRole;
}

export interface CustomRequest extends Request {
    user?: TokenPayload;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}