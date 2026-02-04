import mongoose, { Schema, Document } from 'mongoose';
import { generateUniqueId } from '../utils/generateId';

type ProgrammingLanguage =
    | 'javascript' | 'typescript' | 'python' | 'java'
    | 'c++' | 'c#' | 'php' | 'ruby' | 'go' | 'rust'
    | 'swift' | 'kotlin' | 'dart' | 'scala' | 'r'
    | 'sql' | 'html' | 'css' | 'bash' | 'powershell';

export interface IQuestion extends Document {
    id: number;
    type: 'mcq' | 'coding' | 'query' | 'subjective';
    question: string;
    marks: number;
    difficulty: 'easy' | 'medium' | 'hard';
    categoryId: number;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;

    // Type-specific fields (using discriminators or union types)
    options?: {
        id: number;
        text: string;
        isCorrect: boolean;
    }[];
    allowMultiple?: boolean;
    negativeMarks?: number;
    explanation?: string;

    language?: ProgrammingLanguage;
    allowedLanguages?: ProgrammingLanguage[];
    starterCode?: { [key in ProgrammingLanguage]?: string };
    testCases?: {
        testCaseId: number;
        input: string;
        expectedOutput: string;
        isPublic: boolean;
        points: number;
    }[];
    constraints?: string;
    hints?: string[];
    timeLimit?: number;
    memoryLimit?: number;

    databaseType?: 'mysql' | 'postgresql' | 'mongodb' | 'sqlite';
    databaseSchema?: string;
    tables?: any[];
    sampleData?: any[];
    expectedQuery?: string;
    expectedOutput?: any[];

    maxLength?: number;
    minLength?: number;
    expectedKeywords?: string[];
    evaluationRubric?: {
        criteria: string;
        maxScore: number;
        description: string;
    }[];
}

const TestCaseSchema = new Schema({
    testCaseId: { type: Number, required: true },
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isPublic: { type: Boolean, default: false },
    points: { type: Number, default: 1 },
});

const OptionSchema = new Schema({
    id: { type: Number, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
});

const RubricSchema = new Schema({
    criteria: { type: String, required: true },
    maxScore: { type: Number, required: true, min: 0 },
    description: { type: String },
});

const questionSchema = new Schema<IQuestion>(
    {
        id: { type: Number, unique: true },
        type: {
            type: String,
            enum: ['mcq', 'coding', 'query', 'subjective'],
            required: true,
        },
        question: {
            type: String,
            required: true,
            trim: true
        },
        marks: {
            type: Number,
            required: true,
            min: 0
        },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            required: true,
        },
        categoryId: {
            type: Number,
            required: true,
            ref: 'AssessmentCategory'
        },
        tags: [String],

        // MCQ fields
        options: [OptionSchema],
        allowMultiple: { type: Boolean, default: false },
        negativeMarks: { type: Number, default: 0, min: 0 },
        explanation: String,

        // Coding fields
        language: String,
        allowedLanguages: [String],
        starterCode: Schema.Types.Mixed,
        testCases: [TestCaseSchema],
        constraints: String,
        hints: [String],
        timeLimit: { type: Number, min: 1 }, // in seconds
        memoryLimit: { type: Number, min: 1 }, // in MB

        // Query fields
        databaseType: String,
        databaseSchema: String,
        tables: Schema.Types.Mixed,
        sampleData: Schema.Types.Mixed,
        expectedQuery: String,
        expectedOutput: Schema.Types.Mixed,

        // Subjective fields
        maxLength: { type: Number, min: 1 },
        minLength: { type: Number, min: 1 },
        expectedKeywords: [String],
        evaluationRubric: [RubricSchema],
    },
    { timestamps: true }
);

// Pre-save hook to generate userId
questionSchema.pre('save', async function () {
    if (this.isNew && !this.id) {
        this.id = await generateUniqueId('question');
    }
});

export default mongoose.model<IQuestion>('Question', questionSchema);