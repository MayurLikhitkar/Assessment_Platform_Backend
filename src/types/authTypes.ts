import { Request } from "express";
import { Types } from "mongoose";

export enum UserRole {
    USER = 'user',
    EVALUATOR = 'evaluator',
    ADMIN = 'admin',
    SUPER_ADMIN = 'super_admin',
    PROCTOR = 'proctor',
}

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
    BANNED = 'banned',
}

export interface Email {
    email: string;
    isVerified: boolean;
}

export interface Phone {
    phone: string;
    isVerified: boolean;
}

export interface PersonalInfo {
    dateOfBirth?: Date;
    profilePicture?: string;
    nickName?: string;
    gender?: string;
    portfolio?: string;
}

export interface Education {
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: Date;
    endDate?: Date;
    isCurrent: boolean;
}

export interface WorkExperience {
    company: string;
    role: string;
    startDate: Date;
    endDate?: Date;
    isCurrent: boolean;
}

export interface Qualification {
    skills: string[];
    education: Education[];
    workExperience: WorkExperience[];
    experience: number;
}

export interface Location {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
}

export type SocialProfile = Record<string, string>

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