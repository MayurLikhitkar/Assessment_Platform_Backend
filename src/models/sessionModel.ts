import mongoose, { Schema, Document } from 'mongoose';
import { generateUniqueId } from '../utils/generateId';

export interface ISession extends Document {
    id: number;
    userId: number;
    assessmentId: number;
    userAssessmentId: number;
    startTime: Date;
    lastActive: Date;
    endTime?: Date;
    ipAddress: string;
    userAgent: string;
    deviceInfo: {
        os: string;
        browser: string;
        screenResolution: string;
    };
    isActive: boolean;
    tabChanges: number;
    fullscreenExits: number;
    faceDetectionEvents: {
        timestamp: Date;
        confidence: number;
        multipleFaces: boolean;
        noFace: boolean;
    }[];
    audioLevels: {
        timestamp: Date;
        level: number;
        isSilent: boolean;
    }[];
    recordingStarted: boolean;
    recordingChunks: string[];
    recordingComplete: boolean;
    terminationReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const FaceDetectionEventSchema = new Schema({
    timestamp: { type: Date, default: Date.now },
    confidence: { type: Number, min: 0, max: 1 },
    multipleFaces: { type: Boolean, default: false },
    noFace: { type: Boolean, default: false },
});

const AudioLevelSchema = new Schema({
    timestamp: { type: Date, default: Date.now },
    level: { type: Number, min: 0, max: 100 },
    isSilent: { type: Boolean, default: false },
});

const sessionSchema = new Schema<ISession>(
    {
        id: { type: Number, unique: true },
        userId: {
            type: Number,
            required: true,
            ref: 'User'
        },
        assessmentId: {
            type: Number,
            required: true,
            ref: 'Assessment'
        },
        userAssessmentId: {
            type: Number,
            required: true,
            ref: 'UserAssessment'
        },
        startTime: {
            type: Date,
            required: true,
            default: Date.now
        },
        lastActive: {
            type: Date,
            required: true,
            default: Date.now
        },
        endTime: Date,
        ipAddress: String,
        userAgent: String,
        deviceInfo: {
            os: String,
            browser: String,
            screenResolution: String,
        },
        isActive: {
            type: Boolean,
            default: true
        },
        tabChanges: {
            type: Number,
            default: 0
        },
        fullscreenExits: {
            type: Number,
            default: 0
        },
        faceDetectionEvents: [FaceDetectionEventSchema],
        audioLevels: [AudioLevelSchema],
        recordingStarted: {
            type: Boolean,
            default: false
        },
        recordingChunks: [String],
        recordingComplete: {
            type: Boolean,
            default: false
        },
        terminationReason: String,
    },
    { timestamps: true }
);

// Pre-save hook to generate userId
sessionSchema.pre('save', async function () {
    if (this.isNew && !this.id) {
        this.id = await generateUniqueId('question');
    }
});

export default mongoose.model<ISession>('Session', sessionSchema);