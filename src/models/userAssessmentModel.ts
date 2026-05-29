import mongoose, { Schema, Document, Types } from 'mongoose';
import { generateUniqueId } from '../utils/generateId';
import { UserAssessmentStatus, VoilationType } from '../types/userAssessmentTypes';

export interface IUserAssessment extends Document {
    id: number;
    userId: Types.ObjectId;
    assessmentId: Types.ObjectId;
    status: UserAssessmentStatus;
    startedAt?: Date;
    completedAt?: Date;
    timeSpentInSeconds: number;
    score: number;
    totalMarks: number;
    answers: any[];

    // Proctoring data
    recordingUrl?: string;
    tabSwitches: number;
    fullscreenExits: number;
    violations: {
        type: VoilationType;
        timestamp: Date;
        details?: string;
    }[];

    evaluatedBy?: Types.ObjectId;
    evaluationDate?: Date;
    feedback?: string;
    isPassed: boolean;
    createdBy: Types.ObjectId;
    updatedBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AnswerSchema = new Schema({
    questionId: { type: Number, required: true },
    type: {
        type: String,
        enum: ['mcq', 'coding', 'query', 'subjective'],
        required: true,
    },
    answer: Schema.Types.Mixed,
    marksObtained: { type: Number, default: 0 },
    timeTaken: { type: Number, default: 0 }, // in seconds
    submittedAt: { type: Date, default: Date.now },
    evaluated: { type: Boolean, default: false },
    evaluatorNotes: String,
});

const ViolationSchema = new Schema({
    type: {
        type: String,
        enum: ['tab_switch', 'fullscreen_exit', 'no_webcam', 'multiple_faces', 'no_audio'],
        required: true,
    },
    timestamp: { type: Date, default: Date.now },
    details: String,
});

const userAssessmentSchema = new Schema<IUserAssessment>(
    {
        id: { type: Number, unique: true, index: true },
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        assessmentId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Assessment'
        },
        status: {
            type: String,
            enum: Object.values(UserAssessmentStatus),
            default: UserAssessmentStatus.ASSIGNED,
        },
        startedAt: Date,
        completedAt: Date,
        timeSpentInSeconds: {
            type: Number,
            default: 0 // in seconds
        },
        score: {
            type: Number,
            min: 0,
            default: 0,
        },
        totalMarks: {
            type: Number,
            required: true
        },
        answers: [AnswerSchema],

        // Proctoring data
        recordingUrl: String,
        tabSwitches: { type: Number, default: 0 },
        fullscreenExits: { type: Number, default: 0 },
        violations: [ViolationSchema],

        evaluatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        evaluationDate: Date,
        feedback: String,
        isPassed: Boolean,
    },
    { timestamps: true }
);

// Pre-save hook to generate userId
userAssessmentSchema.pre('save', async function () {
    if (this.isNew && !this.id) {
        this.id = await generateUniqueId('userAssessment');
    }
});

export default mongoose.model<IUserAssessment>('UserAssessment', userAssessmentSchema);