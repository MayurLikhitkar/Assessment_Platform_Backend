import mongoose, { Schema, Document, Types } from 'mongoose';
import { AssessmentDifficulty, AssessmentType, ILimit, IRecord } from '../types/assessmentTypes';

export interface IAssessment extends Document {
    title: string;
    description: string;
    type: AssessmentType[];
    difficulty: AssessmentDifficulty;
    durationInMinutes: number;
    totalMarks: number;
    passingMarks: number;
    questions: Types.ObjectId[];
    startDate?: Date;
    endDate?: Date;
    tags: string[];
    instructions: string;
    isActive: boolean;
    isPublic: boolean;
    negativeMarking: boolean;
    createdAt: Date;
    updatedAt: Date;

    // Proctoring settings
    webcam: IRecord;
    microphone: IRecord;
    enableRecording: boolean;
    tabSwitch: ILimit;
    fullscreenExit: ILimit;

    createdBy: Types.ObjectId;
    updatedBy: Types.ObjectId;
}

const limitSchema = new Schema<ILimit>(
    {
        allowed: {
            type: Boolean,
            default: false,
        },
        max: {
            type: Number,
            min: 0,
        },
    },
    { _id: false }
);

const recordSchema = new Schema<IRecord>(
    {
        allowed: {
            type: Boolean,
            default: false
        },
        url: {
            type: String,
            default: ''
        },
    },
    { _id: false }
);

const assessmentSchema = new Schema<IAssessment>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },
        description: {
            type: String,
            required: true,
            maxlength: 10000
        },
        type: {
            type: [String],
            enum: Object.values(AssessmentType),
            required: true,
        },
        difficulty: {
            type: String,
            enum: Object.values(AssessmentDifficulty),
            required: true,
        },
        durationInMinutes: {
            type: Number,
            required: true,
            min: 5,
            max: 300
        },
        totalMarks: {
            type: Number,
            default: 0,
            min: 0
        },
        passingMarks: {
            type: Number,
            default: 0,
            min: 0
        },
        questions: {
            type: [Schema.Types.ObjectId],
            ref: 'Question',
            default: []
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        isActive: {
            type: Boolean,
            default: false
        },
        isPublic: {
            type: Boolean,
            default: false
        },
        negativeMarking: {
            type: Boolean,
            default: false
        },
        startDate: Date,
        endDate: Date,
        tags: {
            type: [String],
            required: true,
            validate: [(val: string[]) => val.length > 0, 'At least one tag required']
        },
        instructions: {
            type: String,
            default: 'Please read all instructions carefully before starting.'
        },

        // Proctoring settings
        enableRecording: { type: Boolean, default: false },
        webcam: {
            type: recordSchema,
            default: () => ({ allowed: false }),
        },
        microphone: {
            type: recordSchema,
            default: () => ({ allowed: false }),
        },
        tabSwitch: {
            type: limitSchema,
            default: () => ({ allowed: false }),
        },
        fullscreenExit: {
            type: limitSchema,
            default: () => ({ allowed: false }),
        },
    },
    { timestamps: true }
);

// Text index for $text search on title, description, and tags
assessmentSchema.index({
    title: 'text',
    description: 'text',
    tags: 'text'
});

// Separate filter indexes
assessmentSchema.index({ isActive: 1, isPublic: 1 });
assessmentSchema.index({ difficulty: 1 });
assessmentSchema.index({ type: 1 });

export default mongoose.model<IAssessment>('Assessment', assessmentSchema);