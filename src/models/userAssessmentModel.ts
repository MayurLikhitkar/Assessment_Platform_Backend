import mongoose, { Schema, Document } from 'mongoose';
import { generateUniqueId } from '../utils/generateId';

export interface IUserAssessment extends Document {
    id: number;
    userId: number;
    assessmentId: number;
    status: 'assigned' | 'in-progress' | 'completed' | 'expired' | 'terminated';
    startedAt?: Date;
    completedAt?: Date;
    timeSpent: number;
    score?: number;
    totalMarks: number;
    answers: any[];

    // Proctoring data
    recordingUrl?: string;
    tabSwitches: number;
    fullscreenExits: number;
    violations: {
        type: 'tab_switch' | 'fullscreen_exit' | 'no_webcam' | 'multiple_faces' | 'no_audio';
        timestamp: Date;
        details?: string;
    }[];

    evaluatedBy?: number;
    evaluationDate?: Date;
    feedback?: string;
    isPassed: boolean;
    createdBy: number;
    updatedBy: number;
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
        status: {
            type: String,
            enum: ['assigned', 'in-progress', 'completed', 'expired', 'terminated'],
            default: 'assigned',
        },
        startedAt: Date,
        completedAt: Date,
        timeSpent: {
            type: Number,
            default: 0 // in seconds
        },
        score: {
            type: Number,
            min: 0
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
            type: Number,
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