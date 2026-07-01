import { Request } from "express";
import { UserRole } from "../models/userModel";
import { Types } from "mongoose";

export interface TokenPayload {
    _id: Types.ObjectId;
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