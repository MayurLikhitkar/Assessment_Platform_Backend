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

export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
    OTHER = 'other',
}

export interface PersonalInfo {
    dateOfBirth?: Date;
    profilePicture?: string;
    nickName?: string;
    gender?: Gender;
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
    languages: string[];
    education: Education[];
    workExperience: WorkExperience[];
    totalExperience: number;
}

export interface Location {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
}

export interface SocialProfile {
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
    website?: string;
}

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