import { Response } from 'express';
import { QueryFilter, Types } from 'mongoose';
import * as csv from 'csv-parser';
import { Readable } from 'node:stream';
import questionModel, { IQuestion } from '../models/questionModel';
import { CustomRequest } from '../types/authTypes';
import { HttpStatus } from '../utils/constants';
import { errorResponse, successResponse } from '../utils/responseHandler';

/**
 * Get questions with filtering, pagination, and search
 * @route GET /api/questions
 * @access Private
 */
export const getQuestions = async (req: CustomRequest, res: Response) => {
    const {
        type,
        difficulty,
        categoryId,
        tags,
        isActive,
        page = 1,
        limit = 10,
        search,
    } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const filter: QueryFilter<IQuestion> = {};

    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;
    if (categoryId) filter.categoryId = Number(categoryId);

    if (tags) {
        const tagList = Array.isArray(tags) ? tags : (tags as string).split(',').map(t => t.trim());
        filter.tags = { $in: tagList };
    }

    if (isActive !== undefined) {
        filter.isActive = String(isActive) === 'true';
    }

    if (search) {
        const searchRegex = new RegExp(
            (search as string).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            'i'
        );
        filter.$or = [
            { question: searchRegex },
            { tags: searchRegex },
        ];
    }

    const [questions, total] = await Promise.all([
        questionModel
            .find(filter)
            .select('-__v')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber)
            .populate('categoryId', 'name description')
            .lean()
            .exec(),
        questionModel.countDocuments(filter).exec()
    ]);

    const totalPages = Math.ceil(total / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    return res.status(HttpStatus.OK).json(
        successResponse('Questions fetched successfully', questions, {
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages,
                hasNextPage,
                hasPrevPage,
            },
        })
    );
};

/**
 * Get question by ID
 * @route GET /api/questions/:id
 * @access Private
 */
export const getQuestionById = async (req: CustomRequest, res: Response) => {
    const question = await questionModel
        .findOne({ id: Number(req.params.id) })
        .select('-__v')
        .populate('categoryId', 'name description')
        .lean()
        .exec();

    if (!question) {
        return res.status(HttpStatus.NOT_FOUND).json(
            errorResponse('Question not found', `No question found with ID: ${req.params.id}`)
        );
    }

    return res.status(HttpStatus.OK).json(
        successResponse('Question fetched successfully', question)
    );
};

/**
 * Create a new question
 * @route POST /api/questions
 * @access Private (Admin/Super Admin)
 */
export const createQuestion = async (req: CustomRequest, res: Response) => {
    if (!req.user?.userId) {
        return res.status(HttpStatus.UNAUTHORIZED).json(
            errorResponse('Authentication required', 'User must be authenticated to create a question')
        );
    }

    const {
        type,
        question: questionText,
        marks,
        difficulty,
        categoryId,
        tags,
        isActive,
        // MCQ fields
        options,
        allowMultiple,
        negativeMarks,
        explanation,
        // Coding fields
        language,
        allowedLanguages,
        starterCode,
        testCases,
        constraints,
        hints,
        timeLimit,
        memoryLimit,
        // Query fields
        databaseType,
        databaseSchema,
        sampleData,
        expectedQuery,
        // Subjective fields
        minLength,
        maxLength,
        expectedKeywords,
        evaluationRubric,
    } = req.body;

    const newQuestion = new questionModel({
        type,
        question: questionText,
        marks,
        difficulty,
        categoryId,
        tags,
        isActive: isActive !== false,
        createdBy: new Types.ObjectId(req.user.userId),
        // MCQ fields
        options,
        allowMultiple,
        negativeMarks,
        explanation,
        // Coding fields
        language,
        allowedLanguages,
        starterCode,
        testCases,
        constraints,
        hints,
        timeLimit,
        memoryLimit,
        // Query fields
        databaseType,
        databaseSchema,
        sampleData,
        expectedQuery,
        // Subjective fields
        minLength,
        maxLength,
        expectedKeywords,
        evaluationRubric,
    });

    await newQuestion.save();

    const populatedQuestion = await questionModel
        .findById(newQuestion._id)
        .select('-__v')
        .populate('categoryId', 'name description')
        .lean()
        .exec();

    return res.status(HttpStatus.CREATED).json(
        successResponse('Question created successfully', populatedQuestion)
    );
};

/**
 * Update an existing question
 * @route PUT /api/questions/:id
 * @access Private (Admin/Super Admin)
 */
export const updateQuestion = async (req: CustomRequest, res: Response) => {
    if (!req.user?.userId) {
        return res.status(HttpStatus.UNAUTHORIZED).json(
            errorResponse('Authentication required', 'User must be authenticated to update a question')
        );
    }

    const question = await questionModel.findOne({ id: Number(req.params.id) });

    if (!question) {
        return res.status(HttpStatus.NOT_FOUND).json(
            errorResponse('Question not found', `No question found with ID: ${req.params.id}`)
        );
    }

    // Whitelist allowed update fields — prevent overwriting id, _id, createdBy, etc.
    const allowedFields = [
        'type', 'question', 'marks', 'difficulty', 'categoryId', 'tags', 'isActive',
        // MCQ
        'options', 'allowMultiple', 'negativeMarks', 'explanation',
        // Coding
        'language', 'allowedLanguages', 'starterCode', 'testCases',
        'constraints', 'hints', 'timeLimit', 'memoryLimit',
        // Query
        'databaseType', 'databaseSchema', 'sampleData', 'expectedQuery',
        // Subjective
        'minLength', 'maxLength', 'expectedKeywords', 'evaluationRubric',
    ] as const;

    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            (question as any)[field] = req.body[field];
        }
    }

    question.updatedBy = new Types.ObjectId(req.user.userId);

    await question.save();

    const populatedQuestion = await questionModel
        .findById(question._id)
        .select('-__v')
        .populate('categoryId', 'name description')
        .lean()
        .exec();

    return res.status(HttpStatus.OK).json(
        successResponse('Question updated successfully', populatedQuestion)
    );
};

/**
 * Soft-delete a question (sets isActive = false)
 * @route DELETE /api/questions/:id
 * @access Private (Admin/Super Admin)
 */
export const deleteQuestion = async (req: CustomRequest, res: Response) => {
    if (!req.user?.userId) {
        return res.status(HttpStatus.UNAUTHORIZED).json(
            errorResponse('Authentication required', 'User must be authenticated to delete a question')
        );
    }

    const question = await questionModel.findOne({ id: Number(req.params.id) });

    if (!question) {
        return res.status(HttpStatus.NOT_FOUND).json(
            errorResponse('Question not found', `No question found with ID: ${req.params.id}`)
        );
    }

    if (!question.isActive) {
        return res.status(HttpStatus.BAD_REQUEST).json(
            errorResponse('Question already inactive', 'This question has already been deactivated')
        );
    }

    question.isActive = false;
    question.updatedBy = new Types.ObjectId(req.user.userId);
    await question.save();

    return res.status(HttpStatus.OK).json(
        successResponse('Question deactivated successfully', { id: question.id })
    );
};

/**
 * Get questions by category with pagination
 * @route GET /api/questions/category/:categoryId
 * @access Private
 */
export const getQuestionsByCategory = async (req: CustomRequest, res: Response) => {
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const filter: QueryFilter<IQuestion> = {
        categoryId: req.params.categoryId,
        isActive: true,
    };

    const [questions, total] = await Promise.all([
        questionModel
            .find(filter)
            .select('-__v')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber)
            .lean()
            .exec(),
        questionModel.countDocuments(filter).exec()
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    return res.status(HttpStatus.OK).json(
        successResponse('Questions fetched successfully', questions, {
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages,
                hasNextPage: pageNumber < totalPages,
                hasPrevPage: pageNumber > 1,
            },
        })
    );
};

/**
 * Import questions from a CSV file
 * @route POST /api/questions/import
 * @access Private (Admin/Super Admin)
 */
export const importQuestions = async (req: CustomRequest, res: Response) => {
    if (!req.user?.userId) {
        return res.status(HttpStatus.UNAUTHORIZED).json(
            errorResponse('Authentication required', 'User must be authenticated to import questions')
        );
    }

    if (!req.file) {
        return res.status(HttpStatus.BAD_REQUEST).json(
            errorResponse('No file uploaded', 'A CSV file is required for import')
        );
    }

    const rows: Record<string, string>[] = [];
    const errors: { row: number; error: string }[] = [];

    // Parse CSV file
    const buffer = req.file.buffer.toString();
    const stream = Readable.from(buffer);

    await new Promise<void>((resolve, reject) => {
        stream
            .pipe(csv())
            .on('data', (data: Record<string, string>) => rows.push(data))
            .on('end', resolve)
            .on('error', reject);
    });

    let successCount = 0;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;
        try {
            const questionData: Record<string, unknown> = {
                type: row.type,
                question: row.question,
                marks: Number(row.marks),
                difficulty: row.difficulty,
                categoryId: Number(row.categoryId),
                tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
                createdBy: req.user.userId,
            };

            // Parse type-specific fields
            if (row.type === 'mcq') {
                questionData.options = JSON.parse(row.options || '[]');
                questionData.allowMultiple = row.allowMultiple === 'true';
                questionData.negativeMarks = Number.parseFloat(row.negativeMarks || '0') || 0;
                questionData.explanation = row.explanation ?? '';
            } else if (row.type === 'coding') {
                questionData.language = row.language;
                questionData.allowedLanguages = JSON.parse(row.allowedLanguages || '[]');
                questionData.testCases = JSON.parse(row.testCases || '[]');
                questionData.constraints = row.constraints ?? '';
                questionData.hints = JSON.parse(row.hints || '[]');
            } else if (row.type === 'query') {
                questionData.databaseType = row.databaseType;
                questionData.databaseSchema = row.databaseSchema ?? '';
                questionData.sampleData = row.sampleData ?? '';
                questionData.expectedQuery = row.expectedQuery ?? '';
            } else if (row.type === 'subjective') {
                questionData.minLength = Number(row.minLength) || undefined;
                questionData.maxLength = Number(row.maxLength) || undefined;
                questionData.expectedKeywords = JSON.parse(row.expectedKeywords || '[]');
                questionData.evaluationRubric = JSON.parse(row.evaluationRubric || '[]');
            }

            const question = new questionModel(questionData);
            await question.save();
            successCount++;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            errors.push({ row: i + 1, error: message });
        }
    }

    return res.status(HttpStatus.OK).json(
        successResponse('Import completed', {
            total: rows.length,
            success: successCount,
            failed: errors.length,
            errors,
        })
    );
};

/**
 * Export questions as CSV
 * @route GET /api/questions/export
 * @access Private (Admin/Super Admin)
 */
export const exportQuestions = async (_req: CustomRequest, res: Response) => {
    const questions = await questionModel.find().lean().exec();

    const csvData = questions.map((q) => ({
        id: q.id,
        type: q.type,
        question: q.question,
        marks: q.marks,
        difficulty: q.difficulty,
        categoryId: q.categoryId,
        tags: q.tags?.join(',') ?? '',
        // MCQ
        options: q.type === 'mcq' ? JSON.stringify(q.options) : '',
        allowMultiple: q.type === 'mcq' ? q.allowMultiple : '',
        negativeMarks: q.type === 'mcq' ? q.negativeMarks : '',
        explanation: q.type === 'mcq' ? q.explanation : '',
        // Coding
        language: q.type === 'coding' ? q.language : '',
        allowedLanguages: q.type === 'coding' ? JSON.stringify(q.allowedLanguages) : '',
        testCases: q.type === 'coding' ? JSON.stringify(q.testCases) : '',
        constraints: q.type === 'coding' ? q.constraints : '',
        hints: q.type === 'coding' ? JSON.stringify(q.hints) : '',
        // Query
        databaseType: q.type === 'query' ? q.databaseType : '',
        databaseSchema: q.type === 'query' ? q.databaseSchema : '',
        sampleData: q.type === 'query' ? q.sampleData : '',
        expectedQuery: q.type === 'query' ? q.expectedQuery : '',
        // Subjective
        minLength: q.type === 'subjective' ? q.minLength : '',
        maxLength: q.type === 'subjective' ? q.maxLength : '',
        expectedKeywords: q.type === 'subjective' ? JSON.stringify(q.expectedKeywords) : '',
        evaluationRubric: q.type === 'subjective' ? JSON.stringify(q.evaluationRubric) : '',
    }));

    const headers = Object.keys(csvData[0] || {});

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=questions.csv');

    let csvContent = headers.join(',') + '\n';

    for (const row of csvData) {
        const rowData = headers.map(header => {
            const value = (row as Record<string, unknown>)[header];
            return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvContent += rowData.join(',') + '\n';
    }

    return res.send(csvContent);
};