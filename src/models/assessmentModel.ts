import mongoose, { Schema, Document, Types } from 'mongoose';
import { generateUniqueId } from '../utils/generateId';

export enum AssessmentType {
    APTITUDE = 'aptitude',
    CODING = 'coding',
    QUERY = 'query',
    SUBJECTIVE = 'subjective',
    MCQ = 'mcq',
}

export enum AssessmentDifficulty {
    BEGINNER = 'beginner',
    INTERMEDIATE = 'intermediate',
    ADVANCED = 'advanced',
    EXPERT = 'expert',
}

export interface IAssessment extends Document {
    id: number;
    title: string;
    description: string;
    type: AssessmentType[];
    difficulty: AssessmentDifficulty;
    durationInMinutes: number;
    totalMarks: number;
    passingMarks: number;
    questions: Types.ObjectId[];
    createdBy: Types.ObjectId;
    updatedBy: Types.ObjectId;
    isActive: boolean;
    isPublic: boolean;
    startDate?: Date;
    endDate?: Date;
    tags: string[];
    instructions: string;

    // Proctoring settings
    requireWebcam: boolean;
    requireMicrophone: boolean;
    allowTabSwitch: boolean;
    maxTabSwitches: number;
    allowFullscreenExit: boolean;
    maxFullscreenExits: number;
    enableRecording: boolean;

    createdAt: Date;
    updatedAt: Date;
}

const assessmentSchema = new Schema<IAssessment>(
    {
        id: {
            type: Number,
            unique: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },
        description: {
            type: String,
            maxlength: 1000
        },
        type: {
            type: [String],
            enum: Object.values(AssessmentType),
            required: true,
        },
        difficulty: {
            type: String,
            enum: Object.values(AssessmentDifficulty),
            default: AssessmentDifficulty.INTERMEDIATE,
        },
        durationInMinutes: {
            type: Number,
            required: true,
            min: 10,
            max: 240
        },
        totalMarks: {
            type: Number,
            required: true,
            min: 1
        },
        passingMarks: {
            type: Number,
            required: true,
            min: 0
        },
        questions: {
            type: [Schema.Types.ObjectId],
            required: true,
            ref: 'Question'
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        isActive: {
            type: Boolean,
            default: true
        },
        isPublic: {
            type: Boolean,
            default: false
        },
        startDate: Date,
        endDate: Date,
        tags: [String],
        instructions: {
            type: String,
            default: 'Please read all instructions carefully before starting.'
        },

        // Proctoring settings
        requireWebcam: { type: Boolean, default: true },
        requireMicrophone: { type: Boolean, default: true },
        allowTabSwitch: { type: Boolean, default: false },
        maxTabSwitches: { type: Number, default: 2, min: 0 },
        allowFullscreenExit: { type: Boolean, default: false },
        maxFullscreenExits: { type: Number, default: 2, min: 0 },
        enableRecording: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Pre-save hook to generate userId
assessmentSchema.pre('save', async function () {
    if (this.isNew && !this.id) {
        this.id = await generateUniqueId('assessment');
    }
});

export default mongoose.model<IAssessment>('Assessment', assessmentSchema);