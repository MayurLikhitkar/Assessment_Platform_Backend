import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Question from '../models/Question';
import { AuthRequest } from '../middleware/auth';
import * as csv from 'csv-parser';
import * as fs from 'fs';
import { Readable } from 'stream';

export const getQuestions = async (req: Request, res: Response) => {
    try {
        const {
            type,
            difficulty,
            categoryId,
            tags,
            page = 1,
            limit = 10,
            search,
        } = req.query;

        const filter: any = {};

        if (type) filter.type = type;
        if (difficulty) filter.difficulty = difficulty;
        if (categoryId) filter.categoryId = categoryId;
        if (tags) filter.tags = { $in: (tags as string).split(',') };
        if (search) {
            filter.$or = [
                { question: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
            ];
        }

        const questions = await Question.find(filter)
            .skip((+page - 1) * +limit)
            .limit(+limit)
            .sort({ createdAt: -1 });

        const total = await Question.countDocuments(filter);

        res.json({
            questions,
            total,
            page: +page,
            totalPages: Math.ceil(total / +limit),
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getQuestionById = async (req: Request, res: Response) => {
    try {
        const question = await Question.findOne({ questionId: req.params.id });

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        res.json(question);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const createQuestion = async (req: AuthRequest, res: Response) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const questionData = req.body;

        // If it's an MCQ, validate options
        if (questionData.type === 'mcq') {
            if (!questionData.options || questionData.options.length < 2) {
                return res.status(400).json({ message: 'MCQ must have at least 2 options' });
            }

            const correctOptions = questionData.options.filter((opt: any) => opt.isCorrect);
            if (correctOptions.length === 0) {
                return res.status(400).json({ message: 'At least one option must be correct' });
            }

            if (!questionData.allowMultiple && correctOptions.length > 1) {
                return res.status(400).json({
                    message: 'Multiple correct options set but allowMultiple is false'
                });
            }
        }

        // If it's a coding question, validate test cases
        if (questionData.type === 'coding') {
            if (!questionData.testCases || questionData.testCases.length === 0) {
                return res.status(400).json({
                    message: 'Coding question must have at least one test case'
                });
            }
        }

        const question = new Question(questionData);
        await question.save();

        res.status(201).json(question);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateQuestion = async (req: AuthRequest, res: Response) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const question = await Question.findOne({ questionId: req.params.id });

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const updateData = req.body;

        // Validate based on type
        if (updateData.type === 'mcq') {
            if (!updateData.options || updateData.options.length < 2) {
                return res.status(400).json({ message: 'MCQ must have at least 2 options' });
            }

            const correctOptions = updateData.options.filter((opt: any) => opt.isCorrect);
            if (correctOptions.length === 0) {
                return res.status(400).json({ message: 'At least one option must be correct' });
            }

            if (!updateData.allowMultiple && correctOptions.length > 1) {
                return res.status(400).json({
                    message: 'Multiple correct options set but allowMultiple is false'
                });
            }
        }

        if (updateData.type === 'coding') {
            if (!updateData.testCases || updateData.testCases.length === 0) {
                return res.status(400).json({
                    message: 'Coding question must have at least one test case'
                });
            }
        }

        // Update question
        Object.assign(question, updateData);
        await question.save();

        res.json(question);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const deleteQuestion = async (req: AuthRequest, res: Response) => {
    try {
        const question = await Question.findOne({ questionId: req.params.id });

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        await question.deleteOne();
        res.json({ message: 'Question deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getQuestionsByCategory = async (req: Request, res: Response) => {
    try {
        const questions = await Question.find({
            categoryId: req.params.categoryId
        });
        res.json(questions);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const importQuestions = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const results: any[] = [];
        const errors: any[] = [];

        // Parse CSV file
        const buffer = req.file.buffer.toString();
        const stream = Readable.from(buffer);

        await new Promise((resolve, reject) => {
            stream
                .pipe(csv())
                .on('data', (data) => {
                    results.push(data);
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // Process each question
        for (const row of results) {
            try {
                const questionData: any = {
                    type: row.type,
                    question: row.question,
                    marks: parseInt(row.marks),
                    difficulty: row.difficulty,
                    categoryId: parseInt(row.categoryId),
                    tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
                };

                // Parse type-specific data
                if (row.type === 'mcq') {
                    questionData.options = JSON.parse(row.options);
                    questionData.allowMultiple = row.allowMultiple === 'true';
                    questionData.negativeMarks = parseFloat(row.negativeMarks) || 0;
                    questionData.explanation = row.explanation;
                } else if (row.type === 'coding') {
                    questionData.language = row.language;
                    questionData.allowedLanguages = JSON.parse(row.allowedLanguages || '[]');
                    questionData.testCases = JSON.parse(row.testCases);
                    questionData.constraints = row.constraints;
                    questionData.hints = JSON.parse(row.hints || '[]');
                }

                const question = new Question(questionData);
                await question.save();
            } catch (error: any) {
                errors.push({
                    row,
                    error: error.message,
                });
            }
        }

        res.json({
            message: `Imported ${results.length - errors.length} questions successfully`,
            total: results.length,
            success: results.length - errors.length,
            failed: errors.length,
            errors,
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const exportQuestions = async (req: AuthRequest, res: Response) => {
    try {
        const questions = await Question.find();

        // Convert to CSV format
        const csvData = questions.map((q: any) => ({
            questionId: q.questionId,
            type: q.type,
            question: q.question,
            marks: q.marks,
            difficulty: q.difficulty,
            categoryId: q.categoryId,
            tags: q.tags.join(','),
            // Type-specific fields
            options: q.type === 'mcq' ? JSON.stringify(q.options) : '',
            allowMultiple: q.type === 'mcq' ? q.allowMultiple : '',
            negativeMarks: q.type === 'mcq' ? q.negativeMarks : '',
            explanation: q.type === 'mcq' ? q.explanation : '',
            language: q.type === 'coding' ? q.language : '',
            allowedLanguages: q.type === 'coding' ? JSON.stringify(q.allowedLanguages) : '',
            testCases: q.type === 'coding' ? JSON.stringify(q.testCases) : '',
            constraints: q.type === 'coding' ? q.constraints : '',
            hints: q.type === 'coding' ? JSON.stringify(q.hints) : '',
        }));

        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=questions.csv');

        // Write CSV header
        const headers = [
            'questionId',
            'type',
            'question',
            'marks',
            'difficulty',
            'categoryId',
            'tags',
            'options',
            'allowMultiple',
            'negativeMarks',
            'explanation',
            'language',
            'allowedLanguages',
            'testCases',
            'constraints',
            'hints',
        ];

        let csvContent = headers.join(',') + '\n';

        csvData.forEach((row: any) => {
            const rowData = headers.map(header => {
                const value = row[header];
                return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
            });
            csvContent += rowData.join(',') + '\n';
        });

        res.send(csvContent);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};