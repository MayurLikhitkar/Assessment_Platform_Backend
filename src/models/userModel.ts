import mongoose, { Schema, Document, Types } from 'mongoose';
import { Education, Gender, Location, PersonalInfo, Qualification, SocialProfile, UserRole, UserStatus, WorkExperience } from '../types/authTypes';

export interface IUser extends Document {
    fullName: string;
    email: string;
    phone?: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    password: string;
    role: UserRole;
    status: UserStatus;

    personalInfo: PersonalInfo;
    qualification: Qualification;
    location: Location;
    socialProfile: SocialProfile;

    lastLogin?: Date;
    resetPasswordToken: string | null;
    resetPasswordExpires: Date | null;

    createdAt: Date;
    updatedAt: Date;
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
}

const personalInfoSchema = new Schema<PersonalInfo>(
    {
        dateOfBirth: {
            type: Date,
            validate: {
                validator: (value: Date) => !value || value <= new Date(),
                message: 'DOB cannot be in the future',
            },
        },
        profilePicture: String,
        nickName: String,
        gender: { type: String, enum: Object.values(Gender) },
    },
    { _id: false }
);

const educationSchema = new Schema<Education>(
    {
        institution: { type: String, required: true },
        degree: { type: String, required: true },
        fieldOfStudy: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        isCurrent: { type: Boolean, default: false },
    },
    { _id: false }
);

const workExperienceSchema = new Schema<WorkExperience>(
    {
        company: { type: String, required: true },
        role: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        isCurrent: { type: Boolean, default: false },
    },
    { _id: false }
);

const qualificationSchema = new Schema<Qualification>(
    {
        skills: { type: [String], default: [] },
        languages: { type: [String], default: [] },
        education: { type: [educationSchema], default: [] },
        workExperience: { type: [workExperienceSchema], default: [] },
        totalExperience: { type: Number, min: 0, max: 60, default: 0 },
    },
    { _id: false }
);

const locationSchema = new Schema<Location>(
    {
        address: String,
        city: String,
        state: String,
        country: String,
    },
    { _id: false }
);

const socialProfileSchema = new Schema<SocialProfile>(
    {
        linkedin: String,
        github: String,
        twitter: String,
        portfolio: String,
        website: String,
    },
    { _id: false }
);

const userSchema = new Schema<IUser>(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            unique: true,
            required: true,
            lowercase: true,
            trim: true
        },
        phone: {
            type: String,
            trim: true,
            select: false
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        isPhoneVerified: {
            type: Boolean,
            default: false,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.USER,
        },
        status: {
            type: String,
            enum: Object.values(UserStatus),
            default: UserStatus.ACTIVE,
        },
        socialProfile: {
            type: socialProfileSchema,
            default: () => ({}),
        },
        personalInfo: {
            type: personalInfoSchema,
            default: () => ({}),
        },
        qualification: {
            type: qualificationSchema,
            default: () => ({}),
        },
        location: {
            type: locationSchema,
            default: () => ({}),
        },
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
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
    },
    { timestamps: true }
);

userSchema.index(
    { phone: 1 },
    {
        unique: true,
        partialFilterExpression: { phone: { $exists: true, $ne: null } }
    }
);
userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });

export default mongoose.model<IUser>('User', userSchema);