import { Schema, Document, Types, model, Model } from 'mongoose';
import { generateUniqueId } from '../utils/generateId';

export enum ProgrammingLanguage {
    JAVASCRIPT = 'javascript',
    TYPESCRIPT = 'typescript',
    PYTHON = 'python',
    JAVA = 'java',
    CPP = 'c++',
    CSHARP = 'c#',
    R = 'r',
    SQL = 'sql',
    HTML = 'html',
    CSS = 'css'
}
export enum QuestionType {
    MCQ = 'mcq',
    CODING = 'coding',
    QUERY = 'query',
    SUBJECTIVE = 'subjective',
}

export enum Difficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard',
}

export enum DatabaseType {
    MYSQL = 'mysql',
    POSTGRESQL = 'postgresql',
    MONGODB = 'mongodb',
    SQLITE = 'sqlite',
}

export interface ITestCase extends Document {
    input: string;
    expectedOutput: string;
    isPublic: boolean;
}

export interface IOption extends Document {
    text: string;
    isCorrect: boolean;
}

export interface IEvaluationRubric extends Document {
    criteria: string;
    maxScore: number;
    description?: string;
}

export interface IQuestion extends Document {
    id: number;
    type: QuestionType;
    question: string;
    questionExplanation: string;
    marks: number;
    difficulty: Difficulty;
    tags: string[];
    isActive: boolean;
    createdBy: Types.ObjectId;
    updatedBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;

    // Type-specific fields (using discriminators or union types)
    options?: IOption[];
    negativeMarks: number;
    answerExplanation: string;

    language?: ProgrammingLanguage;
    allowedLanguages?: ProgrammingLanguage[];
    starterCode?: Map<ProgrammingLanguage, string>;
    testCases?: ITestCase[];
    constraints?: string[];
    hints?: string[];
    timeLimitInMinutes: number; // in minutes
    memoryLimitInMB: number; // in MB

    databaseType?: DatabaseType;
    databaseSchema?: string;
    sampleData?: string;
    expectedQuery?: string;

    maxLength?: number;
    minLength?: number;
    expectedKeywords?: string[];
    evaluationRubric?: IEvaluationRubric[];
}

interface IQuestionMethods {
    isCorrectAnswer(userAnswer: IOption[] | string): boolean;
}

const TestCaseSchema = new Schema<ITestCase>(
    {
        input: {
            type: String,
            required: true,
            trim: true
        },
        expectedOutput: {
            type: String,
            required: true,
            trim: true
        },
        isPublic: {
            type: Boolean,
            default: false
        },
    }
);

const OptionSchema = new Schema<IOption>(
    {
        text: {
            type: String,
            required: true,
            trim: true,
            minlength: 1
        },
        isCorrect: {
            type: Boolean,
            default: false
        },
    }
);

const RubricSchema = new Schema<IEvaluationRubric>(
    {
        criteria: {
            type: String,
            required: [true, 'Rubric criteria is required'],
            trim: true
        },
        maxScore: {
            type: Number,
            required: [true, 'Max score is required'],
            min: [0, 'Max score cannot be negative']
        },
        description: {
            type: String,
            trim: true
        },
    }
);

const questionSchema = new Schema<IQuestion, Model<IQuestion>, IQuestionMethods>(
    {
        id: {
            type: Number,
            unique: true,
            index: true,
        },
        type: {
            type: String,
            enum: Object.values(QuestionType),
            required: true,
            index: true
        },
        question: {
            type: String,
            required: true,
            trim: true,
            minlength: 5,
        },
        questionExplanation: {
            type: String,
            trim: true,
        },
        marks: {
            type: Number,
            required: true,
            min: 0
        },
        difficulty: {
            type: String,
            enum: Object.values(Difficulty),
            required: true,
            index: true
        },
        tags: {
            type: [String],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },

        // MCQ fields
        options: {
            type: [OptionSchema]
        },
        negativeMarks: {
            type: Number,
            default: 0,
            min: 0
        },
        answerExplanation: {
            type: String,
            trim: true
        },

        // Coding fields
        language: {
            type: String,
            enum: Object.values(ProgrammingLanguage)
        },
        allowedLanguages: {
            type: [String],
            enum: Object.values(ProgrammingLanguage)
        },
        starterCode: {
            type: Map,
            of: String
        },
        testCases: {
            type: [TestCaseSchema]
        },
        constraints: {
            type: [String],
            default: []
        },
        hints: {
            type: [String],
            default: []
        },
        timeLimitInMinutes: {
            type: Number,
            min: 1,
            max: 180
        },
        memoryLimitInMB: {
            type: Number,
            min: 1,
            max: 128
        },

        // Query fields
        databaseType: {
            type: String,
            enum: Object.values(DatabaseType)
        },
        databaseSchema: {
            type: String,
            trim: true
        },
        sampleData: {
            type: String,
            trim: true
        },
        expectedQuery: {
            type: String,
            trim: true
        },

        // Subjective fields
        maxLength: {
            type: Number,
            min: 1
        },
        minLength: {
            type: Number,
            min: 1,
        },
        expectedKeywords: {
            type: [String],
            default: []
        },
        evaluationRubric: {
            type: [RubricSchema],
            default: []
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Indexes for better query performance
questionSchema.index({ type: 1, difficulty: 1, categoryId: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ isActive: 1, createdAt: -1 });
questionSchema.index({ question: 'text', tags: 'text' }, { name: 'question_text_search' });

questionSchema.pre('save', async function () {
    if (this.isNew && !this.id) {
        this.id = await generateUniqueId('question');
    }
});

// Instance methods
questionSchema.methods.isCorrectAnswer = function (userAnswer) {
    switch (this.type) {
        case QuestionType.MCQ: {
            if (!this.options) return false;
            const correctIds = this.options
                .filter((opt) => opt.isCorrect)
                .map((opt) => opt._id);

            if (Array.isArray(userAnswer)) {
                return (
                    userAnswer.length === correctIds.length &&
                    userAnswer.every(opt => correctIds.includes(opt._id))
                );
            }
            return false;
        }

        case QuestionType.SUBJECTIVE: {
            if (this.expectedKeywords && typeof userAnswer === 'string') {
                const answerText = userAnswer.trim().toLowerCase();
                const keywords = this.expectedKeywords.map(k => k.trim().toLowerCase());
                return keywords.every(keyword => answerText.includes(keyword));
            }
            return false;
        }

        default:
            return false;
    }
};

// Static methods
questionSchema.statics.findByCategory = function (categoryId: Types.ObjectId) {
    return this.find({ categoryId, isActive: true }).sort({ createdAt: -1 });
};

questionSchema.statics.findByDifficulty = function (difficulty: Difficulty) {
    return this.find({ difficulty, isActive: true }).sort({ createdAt: -1 });
};

questionSchema.statics.findByTags = function (tags: string[]) {
    return this.find({ tags: { $in: tags }, isActive: true }).sort({ createdAt: -1 });
};

export default model<IQuestion>('Question', questionSchema);