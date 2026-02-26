import mongoose, { Schema, Document } from 'mongoose';
import { generateUniqueId } from '../utils/generateId';

type ProgrammingLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'c++' | 'c#' | 'php' | 'ruby' | 'go' | 'rust' | 'swift' | 'kotlin' | 'dart' | 'scala' | 'r' | 'sql' | 'html' | 'css' | 'bash' | 'powershell';

type QuestionType = 'mcq' | 'coding' | 'query' | 'subjective';

type Difficulty = 'easy' | 'medium' | 'hard';

type DatabaseType = 'mysql' | 'postgresql' | 'mongodb' | 'sqlite';

interface ITestCase {
    id: number,
    input: string,
    expectedOutput: string,
    isPublic: boolean,
    points: number,
}

interface IOption {
    id: number,
    text: string,
    isCorrect: boolean,
}

export interface IQuestion extends Document {
    id: number;
    type: QuestionType;
    question: string;
    marks: number;
    difficulty: Difficulty;
    categoryId: number;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;

    // Type-specific fields (using discriminators or union types)
    options?: IOption[];
    allowMultiple?: boolean;
    negativeMarks?: number;
    explanation?: string;

    language?: ProgrammingLanguage;
    allowedLanguages?: ProgrammingLanguage[];
    starterCode?: { [key in ProgrammingLanguage]?: string };
    testCases?: ITestCase[];
    constraints?: string;
    hints?: string[];
    timeLimit?: number;
    memoryLimit?: number;

    databaseType?: DatabaseType;
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

const TestCaseSchema = new Schema<ITestCase>({
    id: { type: Number, required: true },
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isPublic: { type: Boolean, default: false },
    points: { type: Number, default: 1 },
});

const OptionSchema = new Schema<IOption>({
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

questionSchema.pre('save', async function () {
    if (this.isNew && !this.id) {
        this.id = await generateUniqueId('question');
    }
    switch (this.type) {
        case QuestionType.MCQ:
            if (!this.options || this.options.length < 2) {
                throw new Error('MCQ questions must have at least 2 options');
            }
            break;
        // ... other validations
    }
});

export default mongoose.model<IQuestion>('Question', questionSchema);