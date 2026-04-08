import mongoose, { Schema, Document, Types } from 'mongoose';
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
    points: number;
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

const TestCaseSchema = new Schema<ITestCase>(
    {
        input: {
            type: String,
            required: [true, 'Test case input is required'],
            trim: true
        },
        expectedOutput: {
            type: String,
            required: [true, 'Expected output is required'],
            trim: true
        },
        isPublic: {
            type: Boolean,
            default: false
        },
        points: {
            type: Number,
            default: 1,
            min: [0, 'Points cannot be negative']
        },
    }
);

const OptionSchema = new Schema<IOption>(
    {
        text: {
            type: String,
            required: [true, 'Option text is required'],
            trim: true,
            minlength: [1, 'Option text cannot be empty']
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

const questionSchema = new Schema<IQuestion>(
    {
        id: {
            type: Number,
            unique: true,
            index: true
        },
        type: {
            type: String,
            enum: {
                values: Object.values(QuestionType),
                message: '{VALUE} is not a valid question type'
            },
            required: [true, 'Question type is required'],
            index: true
        },
        question: {
            type: String,
            required: [true, 'Question text is required'],
            trim: true,
            minlength: [10, 'Question must be at least 10 characters long']
        },
        questionExplanation: {
            type: String,
            required: [true, 'Question explanation is required'],
            trim: true,
            minlength: [10, 'Question explanation must be at least 10 characters long']
        },
        marks: {
            type: Number,
            required: [true, 'Marks are required'],
            min: [0, 'Marks cannot be negative'],
            validate: {
                validator: Number.isInteger,
                message: 'Marks must be an integer'
            }
        },
        difficulty: {
            type: String,
            enum: {
                values: Object.values(Difficulty),
                message: '{VALUE} is not a valid difficulty level'
            },
            required: [true, 'Difficulty level is required'],
            index: true
        },
        tags: {
            type: [String],
            default: [],
            validate: {
                validator: function (tags: string[]) {
                    return tags.every(tag => tag.trim().length > 0);
                },
                message: 'Tags cannot be empty strings'
            }
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
            type: [OptionSchema],
            validate: {
                validator: function (this: IQuestion, options: IOption[]) {
                    if (this.type !== QuestionType.MCQ) return true;
                    if (!options || options.length < 2) return false;
                    const correctCount = options.filter(opt => opt.isCorrect).length;
                    return correctCount === 1;
                },
                message: 'MCQ must have at least 2 options and appropriate correct answers'
            }
        },
        negativeMarks: {
            type: Number,
            default: 0,
            min: [0, 'Negative marks cannot be negative']
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
            enum: Object.values(ProgrammingLanguage),
            validate: {
                validator: function (this: IQuestion, langs: ProgrammingLanguage[]) {
                    if (this.type !== QuestionType.CODING) return true;
                    return langs && langs.length > 0;
                },
                message: 'Coding questions must have at least one allowed language'
            }
        },
        starterCode: {
            type: Map,
            of: String
        },
        testCases: {
            type: [TestCaseSchema],
            validate: {
                validator: function (this: IQuestion, testCases: ITestCase[]) {
                    if (this.type !== QuestionType.CODING) return true;
                    return testCases && testCases.length > 0;
                },
                message: 'Coding questions must have at least one test case'
            }
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
            min: [1, 'Time limit must be at least 1 minute'],
            max: [80, 'Time limit cannot exceed 80 minutes']
        },
        memoryLimitInMB: {
            type: Number,
            min: [1, 'Memory limit must be at least 1 MB'],
            max: [512, 'Memory limit cannot exceed 512 MB']
        },

        // Query fields
        databaseType: {
            type: String,
            enum: Object.values(DatabaseType),
            validate: {
                validator: function (this: IQuestion, dbType: DatabaseType) {
                    if (this.type !== QuestionType.QUERY) return true;
                    return !!dbType;
                },
                message: 'Query questions must specify a database type'
            }
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
            min: [1, 'Max length must be at least 1 character']
        },
        minLength: {
            type: Number,
            min: [1, 'Min length must be at least 1 character'],
            validate: {
                validator: function (this: IQuestion, minLen: number) {
                    if (!this.maxLength) return true;
                    return minLen <= this.maxLength;
                },
                message: 'Min length cannot exceed max length'
            }
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

        case QuestionType.CODING:
            if (!this.allowedLanguages || this.allowedLanguages.length === 0) {
                throw new Error('Coding questions must have at least one allowed language');
            }
            if (!this.testCases || this.testCases.length === 0) {
                throw new Error('Coding questions must have at least one test case');
            }
            break;

        case QuestionType.QUERY:
            if (!this.databaseType) {
                throw new Error('Query questions must specify a database type');
            }
            if (!this.databaseSchema) {
                throw new Error('Query questions must have a database schema');
            }
            break;

        case QuestionType.SUBJECTIVE:
            if (!this.minLength || !this.maxLength) {
                throw new Error('Subjective questions must specify min and max length');
            }
            break;
    }
});

// Instance methods
questionSchema.methods.isCorrectAnswer = function (
    userAnswer: number[] | string
): boolean {
    switch (this.type) {
        case QuestionType.MCQ: {
            if (!this.options) return false;
            const correctIds = this.options
                .filter((opt: IOption) => opt.isCorrect)
                .map((opt: IOption) => opt._id);

            if (Array.isArray(userAnswer)) {
                return (
                    userAnswer.length === correctIds.length &&
                    userAnswer.every(id => correctIds.includes(id))
                );
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

export default mongoose.model<IQuestion>('Question', questionSchema);