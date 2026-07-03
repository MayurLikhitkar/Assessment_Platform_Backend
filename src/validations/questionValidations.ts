import { body, query, param } from 'express-validator';
import validate from './validate';
import { DatabaseType, Difficulty, IOption, ProgrammingLanguage, QuestionType } from '../types/questionTypes';

// ─── GET /questions query-string validation ───────────────────────────
export const getQuestionsValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt(),
    query('search').optional().trim().isString(),
    query('difficulty')
        .optional()
        .isIn(Object.values(Difficulty))
        .withMessage('Difficulty must be one of: ' + Object.values(Difficulty).join(', ')),
    query('type')
        .optional()
        .isIn(Object.values(QuestionType))
        .withMessage('Type must be one of: ' + Object.values(QuestionType).join(', ')),
    query('isActive').optional().isBoolean().withMessage('isActive must be a boolean').toBoolean(),

    validate
];

// ─── GET /questions/:id param validation ──────────────────────────────
export const getQuestionByIdValidation = [
    param('id').isMongoId().withMessage('ID must be a valid MongoDB ObjectId'),
    validate
];

// ─── POST /questions body validation ──────────────────────────────────
export const createQuestionValidation = [
    body('type')
        .notEmpty().withMessage('Question type is required')
        .isIn(Object.values(QuestionType))
        .withMessage('Type must be one of: ' + Object.values(QuestionType).join(', ')),

    body('question')
        .notEmpty().withMessage('Question is required')
        .isString().withMessage('Question must be a string')
        .trim()
        .isLength({ min: 5 }).withMessage('Question must be at least 5 characters long')
        .isLength({ max: 2000 }).withMessage('Question must not exceed 2000 characters'),

    body('questionExplanation')
        .optional({ values: 'falsy' })
        .isString().withMessage('Question explanation must be a string')
        .trim()
        .isLength({ min: 10 }).withMessage('Question explanation must be at least 10 characters long')
        .isLength({ max: 3000 }).withMessage('Question explanation must not exceed 3000 characters'),

    body('answerExplanation')
        .optional({ values: 'falsy' })
        .isString().withMessage('Answer explanation must be a string')
        .trim()
        .isLength({ min: 10 }).withMessage('Answer explanation must be at least 10 characters long')
        .isLength({ max: 2000 }).withMessage('Answer explanation must not exceed 2000 characters'),

    body('marks')
        .notEmpty().withMessage('Marks are required')
        .isInt({ min: 0, max: 100 }).withMessage('Marks must be between 0 and 100')
        .toInt(),

    body('negativeMarks')
        .optional()
        .isFloat({ min: 0 }).withMessage('Negative marks must be a non-negative number')
        .custom((val, { req }) => {
            if (req.body.marks !== undefined && Number(val) > Number(req.body.marks)) {
                throw new Error('Negative marks cannot exceed marks');
            }
            return true;
        })
        .toFloat(),

    body('difficulty')
        .notEmpty().withMessage('Difficulty is required')
        .isIn(Object.values(Difficulty))
        .withMessage('Difficulty must be one of: ' + Object.values(Difficulty).join(', ')),

    body('tags')
        .notEmpty().withMessage('Tags are required')
        .isArray({ min: 1 }).withMessage('At least one tag is required')
        .custom((tags: string[]) => {
            const unique = new Set(tags.map(t => t.toLowerCase()));
            if (unique.size !== tags.length) throw new Error('Duplicate tags not allowed');
            return true;
        }),
    body('tags.*')
        .isString().withMessage('Each tag must be a string')
        .trim()
        .notEmpty().withMessage('Tags cannot be empty strings'),

    body('hints')
        .optional()
        .isArray().withMessage('Hints must be an array'),
    body('hints.*')
        .optional()
        .isString().withMessage('Each hint must be a string')
        .trim()
        .notEmpty().withMessage('Hints cannot be empty strings'),

    body('timeLimitInSeconds')
        .optional()
        .isInt({ min: 5, max: 7200 }).withMessage('Time limit must be 5-7200 seconds')
        .toInt(),

    // MCQ-specific fields
    body('mcqFields')
        .if(body('type').equals(QuestionType.MCQ))
        .custom((val) => typeof val === 'object' && val !== null && !Array.isArray(val))
        .withMessage('MCQ fields are required if the question type is MCQ'),
    body('mcqFields.isMultiSelect').optional()
        .if(body('type').equals(QuestionType.MCQ))
        .isBoolean().withMessage('isMultiSelect must be a boolean').toBoolean(),
    body('mcqFields.options')
        .if(body('type').equals(QuestionType.MCQ))
        .isArray({ min: 2, max: 10 }).withMessage('There must be between 2 and 10 options')
        .custom((options: IOption[], { req }) => {
            if (!options) return true;
            const isMultiSelect = req.body.mcqFields?.isMultiSelect ?? false;
            const correctCount = options.filter(opt => opt?.isCorrect).length;
            if (correctCount < 1) {
                throw new Error('MCQ must have at least one correct answer');
            }
            if (!isMultiSelect && correctCount !== 1) {
                throw new Error('Only one option can be marked as correct for single-select MCQs');
            }
            const texts = new Set(options.map(o => o.text?.trim().toLowerCase()));
            if (texts.size !== options.length) {
                throw new Error('All options must have unique text');
            }
            return true;
        }),
    body('mcqFields.options.*.text')
        .if(body('type').equals(QuestionType.MCQ))
        .isString().withMessage('Option text must be a string')
        .trim()
        .isLength({ min: 1, max: 500 }).withMessage('Option text must be between 1 and 500 characters'),
    body('mcqFields.options.*.isCorrect')
        .if(body('type').equals(QuestionType.MCQ))
        .isBoolean().withMessage('Option isCorrect must be a boolean')
        .toBoolean(),

    // Coding-specific fields
    body('codingFields')
        .if(body('type').equals(QuestionType.CODING))
        .custom((val) => typeof val === 'object' && val !== null && !Array.isArray(val))
        .withMessage('Coding fields are required if the question type is Coding'),
    body('codingFields.programmingLanguages')
        .if(body('type').equals(QuestionType.CODING))
        .isArray({ min: 1 }).withMessage('At least one programming language must be selected')
        .custom((types: ProgrammingLanguage[]) => {
            const validTypes = new Set(Object.values(ProgrammingLanguage));
            return types.every((t) => validTypes.has(t));
        })
        .withMessage('Type must be one of: ' + Object.values(ProgrammingLanguage).join(', ')),
    body('codingFields.testCases')
        .if(body('type').equals(QuestionType.CODING))
        .isArray({ min: 1 }).withMessage('At least 1 test case is required'),
    body('codingFields.testCases.*.input')
        .if(body('type').equals(QuestionType.CODING))
        .notEmpty().withMessage('Test case input is required')
        .isString().withMessage('Test case input must be a string'),
    body('codingFields.testCases.*.expectedOutput')
        .if(body('type').equals(QuestionType.CODING))
        .notEmpty().withMessage('Test case expected output is required')
        .isString().withMessage('Test case expected output must be a string'),
    body('codingFields.testCases.*.isPublic')
        .optional()
        .if(body('type').equals(QuestionType.CODING))
        .isBoolean().withMessage('isPublic must be a boolean')
        .toBoolean(),
    body('codingFields.constraints')
        .optional()
        .if(body('type').equals(QuestionType.CODING))
        .isArray().withMessage('Constraints must be an array'),
    body('codingFields.constraints.*')
        .if(body('type').equals(QuestionType.CODING))
        .isString().withMessage('Each constraint must be a string')
        .trim()
        .notEmpty().withMessage('Constraints cannot be empty strings'),
    body('codingFields.memoryLimitInMB')
        .optional()
        .if(body('type').equals(QuestionType.CODING))
        .isInt({ min: 128, max: 512 }).withMessage('Memory limit must be 128-512 MB')
        .toInt(),

    // Query-specific fields
    body('queryFields')
        .if(body('type').equals(QuestionType.QUERY))
        .custom((val) => typeof val === 'object' && val !== null && !Array.isArray(val))
        .withMessage('Query fields are required if the question type is Query'),
    body('queryFields.databaseType')
        .if(body('type').equals(QuestionType.QUERY))
        .isIn(Object.values(DatabaseType))
        .withMessage('Database type must be one of: ' + Object.values(DatabaseType).join(', ')),
    body('queryFields.databaseSchema')
        .optional({ values: 'falsy' })
        .if(body('type').equals(QuestionType.QUERY))
        .isString().withMessage('Database schema must be a string')
        .isLength({ min: 10, max: 5000 }).withMessage('Schema must be at least 10 characters long and not exceed 5000 characters')
        .trim(),
    body('queryFields.sampleData')
        .optional({ values: 'falsy' })
        .if(body('type').equals(QuestionType.QUERY))
        .isString().withMessage('Sample data must be a string')
        .isLength({ max: 10000 }).withMessage('Expected query must not exceed 10000 characters')
        .trim(),
    body('queryFields.expectedQuery')
        .if(body('type').equals(QuestionType.QUERY))
        .isString().withMessage('Expected query must be a string')
        .isLength({ min: 5, max: 500 }).withMessage('Expected query must be at least 5 characters long and not exceed 500 characters')
        .trim(),
    body('queryFields.allowedKeywords')
        .optional()
        .if(body('type').equals(QuestionType.QUERY))
        .isArray().withMessage('allowedKeywords must be an array'),
    body('queryFields.allowedKeywords.*')
        .if(body('type').equals(QuestionType.QUERY))
        .isString().withMessage('Each allowed keyword must be a string')
        .trim()
        .notEmpty().withMessage('Allowed keywords cannot be empty strings'),
    body('queryFields.forbiddenKeywords')
        .optional()
        .if(body('type').equals(QuestionType.QUERY))
        .isArray().withMessage('forbiddenKeywords must be an array'),
    body('queryFields.forbiddenKeywords.*')
        .if(body('type').equals(QuestionType.QUERY))
        .isString().withMessage('Each forbidden keyword must be a string')
        .trim()
        .notEmpty().withMessage('Forbidden keywords cannot be empty strings'),

    // Subjective-specific fields
    body('subjectiveFields')
        .if(body('type').equals(QuestionType.SUBJECTIVE))
        .custom((val) => typeof val === 'object' && val !== null && !Array.isArray(val))
        .withMessage('Subjective fields are required if the question type is Subjective'),
    body('subjectiveFields.minLength')
        .if(body('type').equals(QuestionType.SUBJECTIVE))
        .isInt({ min: 1, max: 500 }).withMessage('Min length must be at least 1')
        .toInt(),
    body('subjectiveFields.maxLength')
        .if(body('type').equals(QuestionType.SUBJECTIVE))
        .custom((val, { req }) => {
            if (Number(val) < Number(req.body.subjectiveFields?.minLength)) throw new Error('Max length must be >= min length');
            return true;
        })
        .isInt({ min: 1, max: 500 }).withMessage('Max length is maximum 500')
        .toInt(),
    body('subjectiveFields.expectedKeywords')
        .if(body('type').equals(QuestionType.SUBJECTIVE))
        .isArray().withMessage('Expected keywords must be an array')
        .custom((keywords: string[]) => {
            const unique = new Set(keywords.map(t => t.toLowerCase()));
            if (unique.size !== keywords.length) throw new Error('Duplicate keywords not allowed');
            return true;
        }),
    body('subjectiveFields.expectedKeywords.*')
        .if(body('type').equals(QuestionType.SUBJECTIVE))
        .isString().withMessage('Each keyword must be a string')
        .trim()
        .notEmpty().withMessage('Keywords cannot be empty strings'),
    body('subjectiveFields.sampleAnswer')
        .optional({ values: 'falsy' })
        .if(body('type').equals(QuestionType.SUBJECTIVE))
        .isString().withMessage('Sample answer must be a string')
        .trim()
        .isLength({ max: 2000 }).withMessage('Sample answer must not exceed 2000 characters'),

    validate
];

// ─── PUT /questions/:id body validation ───────────────────────────────
export const updateQuestionValidation = [
    param('id').isMongoId().withMessage('ID must be a valid MongoDB ObjectId'),

    // All fields optional for update (only validate if present)
    body('type')
        .optional()
        .isIn(Object.values(QuestionType))
        .withMessage('Type must be one of: ' + Object.values(QuestionType).join(', ')),

    body('question')
        .optional()
        .isString().withMessage('Question must be a string')
        .trim()
        .isLength({ min: 5 }).withMessage('Question must be at least 5 characters long')
        .isLength({ max: 2000 }).withMessage('Question must not exceed 2000 characters'),

    body('questionExplanation')
        .optional({ values: 'falsy' })
        .isString().withMessage('Question explanation must be a string')
        .trim()
        .isLength({ min: 10 }).withMessage('Question explanation must be at least 10 characters long')
        .isLength({ max: 3000 }).withMessage('Question explanation must not exceed 3000 characters'),

    body('answerExplanation')
        .optional({ values: 'falsy' })
        .isString().withMessage('Answer explanation must be a string')
        .trim()
        .isLength({ min: 10 }).withMessage('Answer explanation must be at least 10 characters long')
        .isLength({ max: 2000 }).withMessage('Answer explanation must not exceed 2000 characters'),

    body('marks')
        .optional()
        .isInt({ min: 0, max: 100 }).withMessage('Marks must be between 0 and 100')
        .toInt(),

    body('negativeMarks')
        .optional()
        .isFloat({ min: 0 }).withMessage('Negative marks must be a non-negative number')
        .custom((val, { req }) => {
            if (req.body.marks !== undefined && Number(val) > Number(req.body.marks)) {
                throw new Error('Negative marks cannot exceed marks');
            }
            return true;
        })
        .toFloat(),

    body('difficulty')
        .optional()
        .isIn(Object.values(Difficulty))
        .withMessage('Difficulty must be one of: ' + Object.values(Difficulty).join(', ')),

    body('tags')
        .optional()
        .isArray({ min: 1 }).withMessage('At least one tag is required')
        .custom((tags: string[]) => {
            const unique = new Set(tags.map(t => t.toLowerCase()));
            if (unique.size !== tags.length) throw new Error('Duplicate tags not allowed');
            return true;
        }),
    body('tags.*')
        .isString().withMessage('Each tag must be a string')
        .trim()
        .notEmpty().withMessage('Tags cannot be empty strings'),

    body('hints')
        .optional()
        .isArray().withMessage('Hints must be an array'),
    body('hints.*')
        .optional()
        .isString().withMessage('Each hint must be a string')
        .trim()
        .notEmpty().withMessage('Hints cannot be empty strings'),

    body('timeLimitInSeconds')
        .optional()
        .isInt({ min: 5, max: 7200 }).withMessage('Time limit must be 5-7200 seconds')
        .toInt(),

    // MCQ-specific fields
    body('mcqFields')
        .optional()
        .if(body('type').equals(QuestionType.MCQ))
        .custom((val) => typeof val === 'object' && val !== null && !Array.isArray(val))
        .withMessage('MCQ fields are required if the question type is MCQ'),
    body('mcqFields.isMultiSelect')
        .optional()
        .if(body('type').equals(QuestionType.MCQ))
        .isBoolean().withMessage('isMultiSelect must be a boolean').toBoolean(),
    body('mcqFields.options')
        .optional()
        .if(body('type').equals(QuestionType.MCQ))
        .isArray({ min: 2, max: 10 }).withMessage('There must be between 2 and 10 options')
        .custom((options: IOption[], { req }) => {
            if (!options) return true;
            const isMultiSelect = req.body.mcqFields?.isMultiSelect ?? false;
            const correctCount = options.filter(opt => opt?.isCorrect).length;
            if (correctCount < 1) {
                throw new Error('MCQ must have at least one correct answer');
            }
            if (!isMultiSelect && correctCount !== 1) {
                throw new Error('Only one option can be marked as correct for single-select MCQs');
            }
            const texts = new Set(options.map(o => o.text?.trim().toLowerCase()));
            if (texts.size !== options.length) {
                throw new Error('All options must have unique text');
            }
            return true;
        }),
    body('mcqFields.options.*.text')
        .optional()
        .if(body('type').equals(QuestionType.MCQ))
        .isString().withMessage('Option text must be a string')
        .trim()
        .isLength({ min: 1, max: 500 }).withMessage('Option text must be between 1 and 500 characters'),
    body('mcqFields.options.*.isCorrect')
        .optional()
        .if(body('type').equals(QuestionType.MCQ))
        .isBoolean().withMessage('Option isCorrect must be a boolean')
        .toBoolean(),

    // Coding-specific fields
    body('codingFields')
        .optional()
        .if(body('type').equals(QuestionType.CODING))
        .custom((val) => typeof val === 'object' && val !== null && !Array.isArray(val))
        .withMessage('Coding fields are required if the question type is Coding'),
    body('codingFields.programmingLanguages')
        .optional()
        .if(body('type').equals(QuestionType.CODING))
        .isArray({ min: 1 }).withMessage('At least one programming language must be selected')
        .custom((types: ProgrammingLanguage[]) => {
            const validTypes = new Set(Object.values(ProgrammingLanguage));
            return types.every((t) => validTypes.has(t));
        })
        .withMessage('Type must be one of: ' + Object.values(ProgrammingLanguage).join(', ')),
    body('codingFields.testCases')
        .optional()
        .if(body('type').equals(QuestionType.CODING))
        .isArray({ min: 1 }).withMessage('At least 1 test case is required'),
    body('codingFields.testCases.*.input')
        .optional()
        .if(body('type').equals(QuestionType.CODING))
        .notEmpty().withMessage('Test case input is required')
        .isString().withMessage('Test case input must be a string'),
    body('codingFields.testCases.*.expectedOutput')
        .optional()
        .if(body('type').equals(QuestionType.CODING))
        .notEmpty().withMessage('Test case expected output is required')
        .isString().withMessage('Test case expected output must be a string'),
    body('codingFields.testCases.*.isPublic')
        .optional()
        .if(body('type').equals(QuestionType.CODING))
        .isBoolean().withMessage('isPublic must be a boolean')
        .toBoolean(),
    // body('constraints')
    body('codingFields.constraints')
        .optional()
        .if(body('type').equals(QuestionType.CODING))
        .isArray().withMessage('Constraints must be an array'),
    body('codingFields.constraints.*')
        .optional()
        .if(body('type').equals(QuestionType.CODING))
        .isString().withMessage('Each constraint must be a string')
        .trim()
        .notEmpty().withMessage('Constraints cannot be empty strings'),
    body('codingFields.memoryLimitInMB')
        .optional()
        .if(body('type').equals(QuestionType.CODING))
        .isInt({ min: 128, max: 512 }).withMessage('Memory limit must be 128-512 MB')
        .toInt(),

    // Query-specific fields
    body('queryFields')
        .optional()
        .if(body('type').equals(QuestionType.QUERY))
        .custom((val) => typeof val === 'object' && val !== null && !Array.isArray(val))
        .withMessage('Query fields are required if the question type is Query'),
    body('queryFields.databaseType')
        .optional()
        .if(body('type').equals(QuestionType.QUERY))
        .isIn(Object.values(DatabaseType))
        .withMessage('Database type must be one of: ' + Object.values(DatabaseType).join(', ')),
    body('queryFields.databaseSchema')
        .optional({ values: 'falsy' })
        .if(body('type').equals(QuestionType.QUERY))
        .isString().withMessage('Database schema must be a string')
        .isLength({ min: 10, max: 5000 }).withMessage('Schema must be at least 10 characters long and not exceed 5000 characters')
        .trim(),
    body('queryFields.sampleData')
        .optional({ values: 'falsy' })
        .if(body('type').equals(QuestionType.QUERY))
        .isString().withMessage('Sample data must be a string')
        .isLength({ max: 10000 }).withMessage('Expected query must not exceed 10000 characters')
        .trim(),
    body('queryFields.expectedQuery')
        .optional()
        .if(body('type').equals(QuestionType.QUERY))
        .isString().withMessage('Expected query must be a string')
        .isLength({ min: 5, max: 500 }).withMessage('Expected query must be at least 5 characters long and not exceed 500 characters')
        .trim(),
    body('queryFields.allowedKeywords')
        .optional()
        .if(body('type').equals(QuestionType.QUERY))
        .isArray().withMessage('allowedKeywords must be an array'),
    body('queryFields.allowedKeywords.*')
        .if(body('type').equals(QuestionType.QUERY))
        .isString().withMessage('Each allowed keyword must be a string')
        .trim()
        .notEmpty().withMessage('Allowed keywords cannot be empty strings'),

    body('queryFields.forbiddenKeywords')
        .optional()
        .if(body('type').equals(QuestionType.QUERY))
        .isArray().withMessage('forbiddenKeywords must be an array'),
    body('queryFields.forbiddenKeywords.*')
        .if(body('type').equals(QuestionType.QUERY))
        .isString().withMessage('Each forbidden keyword must be a string')
        .trim()
        .notEmpty().withMessage('Forbidden keywords cannot be empty strings'),

    // Subjective-specific fields
    body('subjectiveFields')
        .optional()
        .if(body('type').equals(QuestionType.SUBJECTIVE))
        .custom((val) => typeof val === 'object' && val !== null && !Array.isArray(val))
        .withMessage('Subjective fields are required if the question type is Subjective'),
    body('subjectiveFields.minLength')
        .optional()
        .if(body('type').equals(QuestionType.SUBJECTIVE))
        .isInt({ min: 1, max: 500 }).withMessage('Min length must be at least 1')
        .toInt(),
    body('subjectiveFields.maxLength')
        .optional()
        .if(body('type').equals(QuestionType.SUBJECTIVE))
        .custom((val, { req }) => {
            if (Number(val) < Number(req.body.subjectiveFields?.minLength)) throw new Error('Max length must be >= min length');
            return true;
        })
        .isInt({ min: 1, max: 500 }).withMessage('Max length is maximum 500')
        .toInt(),
    body('subjectiveFields.expectedKeywords')
        .optional()
        .if(body('type').equals(QuestionType.SUBJECTIVE))
        .isArray().withMessage('Expected keywords must be an array')
        .custom((keywords: string[]) => {
            const unique = new Set(keywords.map(t => t.toLowerCase()));
            if (unique.size !== keywords.length) throw new Error('Duplicate keywords not allowed');
            return true;
        }),
    body('subjectiveFields.expectedKeywords.*')
        .optional()
        .if(body('type').equals(QuestionType.SUBJECTIVE))
        .isString().withMessage('Each keyword must be a string')
        .trim()
        .notEmpty().withMessage('Keywords cannot be empty strings'),
    body('subjectiveFields.sampleAnswer')
        .optional({ values: 'falsy' })
        .if(body('type').equals(QuestionType.SUBJECTIVE))
        .isString().withMessage('Sample answer must be a string')
        .trim()
        .isLength({ max: 2000 }).withMessage('Sample answer must not exceed 2000 characters'),


    validate
];

// ─── DELETE /questions/:id param validation ───────────────────────────
export const deleteQuestionValidation = [
    param('id').isMongoId().withMessage('ID must be a valid MongoDB ObjectId'),
    validate
];
