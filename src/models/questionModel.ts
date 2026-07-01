import { Schema, Document, model, Model, Types } from 'mongoose';
import { DatabaseType, Difficulty, ICodingFields, IMcqFields, IOption, IQueryFields, ISubjectiveFields, ITestCase, ProgrammingLanguage, QuestionType } from '../types/questionTypes';

export interface IQuestion extends Document {
    type: QuestionType;
    question: string;
    questionExplanation?: string;
    answerExplanation?: string;
    negativeMarks: number;
    marks: number;
    difficulty: Difficulty;
    timeLimitInSeconds?: number; // in seconds
    tags: string[];
    hints?: string[];
    isActive: boolean;
    createdBy: Types.ObjectId;
    updatedBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;

    mcqFields?: IMcqFields;
    codingFields?: ICodingFields;
    queryFields?: IQueryFields;
    subjectiveFields?: ISubjectiveFields;
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
            minlength: 1,
            maxLength: 500
        },
        isCorrect: {
            type: Boolean,
            default: false
        },
    },
    { _id: true }
);

const McqFieldsSchema = new Schema<IMcqFields>(
    {
        options: {
            type: [OptionSchema], required: true,
            validate: {
                validator: (arr: IOption[]) => arr.length >= 2 && arr.length <= 10,
                message: 'There must be between 2 and 10 options',
            },
        },
        isMultiSelect: { type: Boolean, default: false },
    },
    { _id: false }
);

const CodingFieldsSchema = new Schema<ICodingFields>(
    {
        programmingLanguages: {
            type: [String],
            enum: Object.values(ProgrammingLanguage),
            required: true,
        },
        starterCode: { type: Schema.Types.Mixed },
        solutionCode: { type: Schema.Types.Mixed },
        testCases: { type: [TestCaseSchema], required: true },
        constraints: { type: [String] },
        memoryLimitInMB: { type: Number, default: 128, min: 128, max: 512 },
    },
    { _id: false }
);

const QueryFieldsSchema = new Schema<IQueryFields>(
    {
        databaseType: { type: String, enum: Object.values(DatabaseType), required: true },
        databaseSchema: { type: String, trim: true, min: 10, max: 5000 },
        sampleData: { type: String, trim: true, max: 10000 },
        expectedQuery: { type: String, required: true, trim: true, min: 5, max: 500 },
        allowedKeywords: { type: [String] },
        forbiddenKeywords: { type: [String] },
    },
    { _id: false }
);

const SubjectiveFieldsSchema = new Schema<ISubjectiveFields>(
    {
        minLength: { type: Number, required: true, min: 1, max: 500 },
        maxLength: { type: Number, required: true, min: 1, max: 500 },
        expectedKeywords: { type: [String], required: true },
        sampleAnswer: { type: String, trim: true },
    },
    { _id: false }
);

const questionSchema = new Schema<IQuestion, Model<IQuestion>, IQuestionMethods>(
    {
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
            trim: true,
        },
        marks: {
            type: Number,
            required: true,
            min: 0,
            max: 100
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
            required: true,
            validate: [(val: string[]) => val.length > 0, 'At least one tag required']
        },
        hints: { type: [String] },
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
        mcqFields: { type: McqFieldsSchema },
        codingFields: { type: CodingFieldsSchema },
        queryFields: { type: QueryFieldsSchema },
        subjectiveFields: { type: SubjectiveFieldsSchema },
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

// Instance methods
questionSchema.methods.isCorrectAnswer = function (userAnswer) {
    switch (this.type) {
        case QuestionType.MCQ: {
            if (!this.mcqFields) return false;
            const correctIds = this.mcqFields.options
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
            if (this.subjectiveFields?.expectedKeywords && typeof userAnswer === 'string') {
                const answerText = userAnswer.trim().toLowerCase();
                const keywords = this.subjectiveFields.expectedKeywords.map(k => k.trim().toLowerCase());
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