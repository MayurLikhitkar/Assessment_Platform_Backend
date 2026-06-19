import { Schema, Document, model, Model, Types } from 'mongoose';
import { generateUniqueId } from '../utils/generateId';
import { DatabaseType, Difficulty, IOption, ITestCase, ProgrammingLanguage, QuestionType } from '../types/questionTypes';

export interface IQuestion extends Document {
    id: number;
    type: QuestionType;
    question: string;
    questionExplanation: string;
    answerExplanation: string;
    negativeMarks: number;
    marks: number;
    difficulty: Difficulty;
    timeLimitInSeconds?: number; // in seconds
    tags: string[];
    isActive: boolean;
    createdBy: Types.ObjectId;
    updatedBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;

    // mcq fields
    options?: IOption[];
    isMultiSelect?: boolean;

    // coding fields
    programmingLanguages?: ProgrammingLanguage[];
    starterCode?: Partial<Record<ProgrammingLanguage, string>>;
    solutionCode?: Partial<Record<ProgrammingLanguage, string>>;
    testCases?: ITestCase[];
    constraints?: string[];
    hints?: string[];
    memoryLimitInMB?: number;

    // query fields
    databaseType?: DatabaseType;
    databaseSchema?: string;
    sampleData?: string;
    expectedQuery: string;
    allowedKeywords?: string[];
    forbiddenKeywords?: string[];

    // subjective fields
    minLength?: number;
    maxLength?: number;
    wordLimit?: number;
    expectedKeywords?: string[];
    sampleAnswer?: string;
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
    }, { _id: false }
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
        negativeMarks: {
            type: Number,
            default: 0,
            min: 0
        },
        answerExplanation: {
            type: String,
            trim: true
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
        timeLimitInSeconds: {
            type: Number,
            min: 5,
            max: 7200
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
        isMultiSelect: {
            type: Boolean,
            default: false
        },

        // Coding fields
        programmingLanguages: {
            type: [String],
            enum: Object.values(ProgrammingLanguage)
        },
        starterCode: { type: Schema.Types.Mixed },
        solutionCode: { type: Schema.Types.Mixed },
        testCases: {
            type: [TestCaseSchema]
        },
        constraints: {
            type: [String],
        },
        hints: {
            type: [String],
        },
        memoryLimitInMB: {
            type: Number,
            min: 128,
            max: 512
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
        allowedKeywords: {
            type: [String],
        },
        forbiddenKeywords: {
            type: [String],
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
        wordLimit: {
            type: Number,
            min: 1,
        },
        expectedKeywords: {
            type: [String],
            default: []
        },
        sampleAnswer: {
            type: String,
            trim: true
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Indexes for better query performance
questionSchema.index({ type: 1, difficulty: 1 });
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
                .map((opt) => opt.text);

            if (Array.isArray(userAnswer)) {
                return (
                    userAnswer.length === correctIds.length &&
                    userAnswer.every(opt => correctIds.includes(opt.text))
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
questionSchema.statics.findByCategory = function (categoryId: Schema.Types.ObjectId) {
    return this.find({ categoryId, isActive: true }).sort({ createdAt: -1 });
};

questionSchema.statics.findByDifficulty = function (difficulty: Difficulty) {
    return this.find({ difficulty, isActive: true }).sort({ createdAt: -1 });
};

questionSchema.statics.findByTags = function (tags: string[]) {
    return this.find({ tags: { $in: tags }, isActive: true }).sort({ createdAt: -1 });
};

export default model<IQuestion>('Question', questionSchema);