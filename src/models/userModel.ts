import mongoose, { Schema, Document, Types } from 'mongoose';
import { Email, Location, PersonalInfo, Phone, Qualification, SocialProfile, UserRole, UserStatus } from '../types/authTypes';

export interface IUser extends Document {
    fullName: string;
    email: Email;
    phone?: Phone;
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

const emailSchema = new Schema<Email>(
    {
        email: { type: String, required: true, lowercase: true, trim: true },
        isVerified: { type: Boolean, default: false }
    },
    { _id: false }
);

const phoneSchema = new Schema<Phone>(
    {
        phone: { type: String, required: true, trim: true },
        isVerified: { type: Boolean, default: false }
    },
    { _id: false }
);

const personalInfoSchema = new Schema(
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
        gender: String,
        portfolio: String,
    },
    { _id: false }
);

const educationSchema = new Schema(
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

const workExperienceSchema = new Schema(
    {
        company: { type: String, required: true },
        role: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        isCurrent: { type: Boolean, default: false },
    },
    { _id: false }
);

const qualificationSchema = new Schema(
    {
        skills: { type: [String], default: [] },
        education: { type: [educationSchema], default: [] },
        workExperience: { type: [workExperienceSchema], default: [] },
        experience: { type: Number, min: 0, max: 60, default: 0 },
    },
    { _id: false }
);

const locationSchema = new Schema(
    {
        address: String,
        city: String,
        state: String,
        country: String,
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
            type: emailSchema,
            required: true
        },
        phone: {
            type: phoneSchema,
            required: true
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
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
        socialProfile: {
            type: Schema.Types.Mixed,
            of: String,
            default: () => ({})
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

userSchema.index({ "contact.email.value": 1 }, { unique: true });
userSchema.index(
    { "contact.phone.value": 1 },
    {
        unique: true,
        partialFilterExpression: {
            "contact.phone.value": { $exists: true, $ne: null }
        }
    }
);
userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });

export default mongoose.model<IUser>('User', userSchema);