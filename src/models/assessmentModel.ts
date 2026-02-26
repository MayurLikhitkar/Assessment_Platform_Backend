import mongoose, { Schema, Document } from 'mongoose';
import { generateUniqueId } from '../utils/generateId';

export interface IAssessment extends Document {
    id: number;
    title: string;
    description: string;
    categoryId: number;
    type: ('aptitude' | 'coding' | 'query' | 'subjective')[];
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    duration: number;
    totalMarks: number;
    passingMarks: number;
    questions: number[];
    createdBy: number;
    updatedBy: number;
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

const QuestionInAssessmentSchema = new Schema({
    questionId: { type: Number, required: true },
    type: {
        type: String,
        enum: ['mcq', 'coding', 'query', 'subjective'],
        required: true,
    },
    question: String,
    marks: Number,
    difficulty: String,
    index: Number,
});

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
        categoryId: {
            type: Number,
            required: true,
            ref: 'AssessmentCategory'
        },
        type: [{
            type: String,
            enum: ['aptitude', 'coding', 'query', 'subjective'],
            required: true,
        }],
        difficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            default: 'intermediate',
        },
        duration: {
            type: Number,
            required: true,
            min: 1 // in minutes
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
        questions: [QuestionInAssessmentSchema],
        createdBy: {
            type: Number,
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