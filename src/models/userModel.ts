import mongoose, { Schema, Document } from 'mongoose';
import { generateUniqueId } from '../utils/generateId';

export enum UserRole {
    USER = 'user',
    EVALUATOR = 'evaluator',
    ADMIN = 'admin',
    SUPER_ADMIN = 'super_admin',
    PROCTOR = 'proctor', // important for live proctoring
}

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
    BANNED = 'banned',
}

export interface IUser extends Document {
    id: number;
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
    status: UserStatus;
    profilePicture?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    dateOfBirth?: Date;
    skills: string[];
    experience?: number;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLogin?: Date;
    resetPasswordToken: string | null;
    resetPasswordExpires: Date | null;
    requireWebcam: boolean;
    requireMicrophone: boolean;
}

const userSchema = new Schema<IUser>(
    {
        id: {
            type: Number,
            unique: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false,
        },
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        role: {
            type: String,
            enum: UserRole,
            default: UserRole.USER,
        },
        status: {
            type: String,
            enum: UserStatus,
            default: UserStatus.ACTIVE,
        },
        profilePicture: String,
        phone: {
            type: String,
        },
        dateOfBirth: Date,
        country: String,
        state: String,
        city: String,
        skills: {
            type: [String],
            default: [],
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        isPhoneVerified: {
            type: Boolean,
            default: false,
        },
        experience: Number,
        lastLogin: Date,
        resetPasswordToken: {
            type: String,
            select: false,
            default: null,
        },
        resetPasswordExpires: {
            type: Date,
            select: false,
            default: null,
        },
        requireWebcam: { type: Boolean, default: true },
        requireMicrophone: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Pre-save hook to generate userId
userSchema.pre('save', async function () {
    if (this.isNew && !this.id) {
        this.id = await generateUniqueId('user');
    }
});

export default mongoose.model<IUser>('User', userSchema);