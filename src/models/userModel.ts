import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    id: number;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'user' | 'admin' | 'evaluator' | 'super_admin';
    status: 'active' | 'inactive' | 'suspended';
    profilePicture?: string;
    phone?: string;
    dateOfBirth?: Date;
    skills: string[];
    experience?: number;
    createdAt: Date;
    updatedAt: Date;
    lastLogin?: Date;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    requireWebcam: boolean;
    requireMicrophone: boolean;
}

const UserSchema = new Schema<IUser>(
    {
        id: { type: Number, unique: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
        },
        password: {
            type: String,
            required: true,
            minlength: 6
        },
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        role: {
            type: String,
            enum: ['user', 'admin', 'evaluator', 'super_admin'],
            default: 'user',
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'suspended'],
            default: 'active',
        },
        profilePicture: String,
        phone: {
            type: String,
        },
        dateOfBirth: Date,
        skills: [String],
        experience: Number,
        lastLogin: Date,
        resetPasswordToken: String,
        resetPasswordExpires: Date,
        requireWebcam: { type: Boolean, default: true },
        requireMicrophone: { type: Boolean, default: true },
    },
    { timestamps: true }
);


export default mongoose.model<IUser>('User', UserSchema);