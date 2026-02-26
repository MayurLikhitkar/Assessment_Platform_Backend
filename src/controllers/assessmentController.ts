import { Response } from 'express';
import assessmentModel, { IAssessment } from '../models/assessmentModel';
import { GetAssessmentQuery } from '../types/assessmentTypes';
import { QueryFilter } from 'mongoose';
import { HttpStatus } from '../utils/constants';
import { errorResponse, successResponse } from '../utils/responseHandler';
import { AuthRequest } from '../types/authTypes';
import questionModel from '../models/questionModel';


/**
 * Get assessments with filtering, pagination, and search
 * @route GET /api/assessments
 * @access Private
 */
export const getAssessments = async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 10, search, categoryId, difficulty, type, isActive, isPublic, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as unknown as GetAssessmentQuery;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const filter: QueryFilter<IAssessment> = {};

    if (search?.trim()) {
        const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [
            { title: searchRegex },
            { description: searchRegex },
            { tags: searchRegex }
        ];
    }

    if (categoryId) {
        filter.categoryId = Number(categoryId);
    }

    if (difficulty) {
        filter.difficulty = Array.isArray(difficulty)
            ? { $in: difficulty }
            : difficulty;
    }

    if (type) {
        filter.type = { $in: Array.isArray(type) ? type : [type] };
    }

    if (isActive !== undefined) {
        filter.isActive = isActive === 'true' || isActive === true;
    }

    // Public status filter
    if (isPublic !== undefined) {
        filter.isPublic = isPublic === 'true' || isPublic === true;
    }

    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
            filter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999); // End of day
            filter.createdAt.$lte = endDateTime;
        }
    }

    const sortOptions: Record<string, 1 | -1> = {
        [sortBy]: sortOrder === 'asc' ? 1 : -1
    };

    const [assessments, total] = await Promise.all([
        assessmentModel
            .find(filter)
            .select('-__v') // Exclude version key
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNumber)
            .populate('categoryId', 'name description') // Populate category details
            .lean()
            .exec(),
        assessmentModel.countDocuments(filter).exec()
    ]);

    const totalPages = Math.ceil(total / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    return res.status(HttpStatus.OK).json(successResponse('Assessments fetched successfully', assessments,
        {
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages,
                hasNextPage,
                hasPrevPage
            },
            filters: {
                search,
                categoryId,
                difficulty,
                type,
                isActive,
                isPublic,
                startDate,
                endDate
            }
        }
    )
    );
};

/**
 * Get assessment by ID with populated questions
 * @route GET /api/assessments/:id
 * @access Private
 */
export const getAssessmentById = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const assessment = await assessmentModel
        .findOne({
            $or: [
                { assessmentId: id },
                { id: Number(id) }
            ]
        })
        .populate('categoryId', 'name description')
        .populate({
            path: 'questions.questionId',
            select: 'id question type difficulty marks tags'
        })
        .lean()
        .exec();

    if (!assessment) {
        return res.status(HttpStatus.NOT_FOUND).json(errorResponse('Assessment not found', 'Assessment not found'));
    }

    // Check if user has permission to view (if private)
    if (!assessment.isPublic && assessment.createdBy !== req.user?.userId) {
        // Check if user has admin role or specific permissions
        const hasPermission = req.user?.role === 'admin' || req.user?.role === 'instructor';
        if (!hasPermission) {
            return res.status(HttpStatus.FORBIDDEN).json(errorResponse('You do not have permission to view this assessment', 'Only two roles can view private assessments: admin and instructor'));
        }
    }

    return res.status(HttpStatus.OK).json(
        successResponse('Assessment fetched successfully', assessment)
    );
};

/**
 * Create new assessment with validation
 * @route POST /api/assessments
 * @access Private (Instructor/Admin)
 */
export const createAssessment = async (req: AuthRequest, res: Response) => {

};

// export const updateAssessment = async (req: AuthRequest, res: Response) => {
//     try {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({ errors: errors.array() });
//         }

//         const assessment = await assessmentModel.findOne({
//             assessmentId: req.params.id,
//         });

//         if (!assessment) {
//             return res.status(404).json({ message: 'Assessment not found' });
//         }

//         const updateData = req.body;

//         // Validate questions if being updated
//         if (updateData.questions) {
//             for (const q of updateData.questions) {
//                 const question = await Question.findOne({ questionId: q.questionId });
//                 if (!question) {
//                     return res.status(400).json({
//                         message: `Question ${q.questionId} not found`
//                     });
//                 }
//             }
//         }

//         Object.assign(assessment, updateData);
//         await assessment.save();

//         res.json(assessment);
//     } catch (error: any) {
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// };

// export const deleteAssessment = async (req: AuthRequest, res: Response) => {
//     try {
//         const assessment = await assessmentModel.findOne({
//             assessmentId: req.params.id,
//         });

//         if (!assessment) {
//             return res.status(404).json({ message: 'Assessment not found' });
//         }

//         // Check if there are any user assessments
//         const userAssessmentCount = await UserAssessment.countDocuments({
//             assessmentId: assessment.assessmentId,
//         });

//         if (userAssessmentCount > 0) {
//             return res.status(400).json({
//                 message: 'Cannot delete assessment with existing attempts. Deactivate instead.',
//             });
//         }

//         await assessment.deleteOne();
//         res.json({ message: 'Assessment deleted successfully' });
//     } catch (error: any) {
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// };

// export const getUserAssessments = async (req: AuthRequest, res: Response) => {
//     try {
//         const userId = req.params.userId;

//         if (req.user?.userId !== +userId && req.user?.role === 'user') {
//             return res.status(403).json({ message: 'Forbidden' });
//         }

//         const userAssessments = await UserAssessment.find({ userId })
//             .populate('assessmentId', 'title description duration totalMarks')
//             .sort({ createdAt: -1 });

//         res.json(userAssessments);
//     } catch (error: any) {
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// };

// export const startAssessment = async (req: AuthRequest, res: Response) => {
//     try {
//         const assessment = await assessmentModel.findOne({
//             assessmentId: req.params.id,
//             isActive: true,
//         });

//         if (!assessment) {
//             return res.status(404).json({ message: 'Assessment not found or inactive' });
//         }

//         // Check if user already has an assessment in progress
//         const existingUserAssessment = await userAssessmentModel.findOne({
//             userId: req.user?.userId,
//             assessmentId: assessment.assessmentId,
//             status: { $in: ['assigned', 'in-progress'] },
//         });

//         if (existingUserAssessment) {
//             return res.status(400).json({
//                 message: 'You already have an assessment in progress',
//                 userAssessmentId: existingUserAssessment.userAssessmentId,
//             });
//         }

//         // Create user assessment
//         const userAssessment = new userAssessmentModel({
//             userId: req.user?.userId,
//             assessmentId: assessment.assessmentId,
//             status: 'in-progress',
//             startedAt: new Date(),
//             totalMarks: assessment.totalMarks,
//             answers: [],
//         });

//         await userAssessment.save();

//         // Create session
//         const session = new sessionModel({
//             userId: req.user?.userId,
//             assessmentId: assessment.assessmentId,
//             userAssessmentId: userAssessment.userAssessmentId,
//             startTime: new Date(),
//             lastActive: new Date(),
//             ipAddress: req.ip,
//             userAgent: req.headers['user-agent'],
//             deviceInfo: {
//                 os: 'Unknown',
//                 browser: 'Unknown',
//                 screenResolution: 'Unknown',
//             },
//         });

//         await session.save();

//         res.json({
//             userAssessment,
//             sessionId: session.sessionId,
//             assessment: {
//                 title: assessment.title,
//                 duration: assessment.duration,
//                 instructions: assessment.instructions,
//                 questions: assessment.questions,
//                 proctoringSettings: {
//                     requireWebcam: assessment.requireWebcam,
//                     requireMicrophone: assessment.requireMicrophone,
//                     allowTabSwitch: assessment.allowTabSwitch,
//                     maxTabSwitches: assessment.maxTabSwitches,
//                     allowFullscreenExit: assessment.allowFullscreenExit,
//                     maxFullscreenExits: assessment.maxFullscreenExits,
//                     enableRecording: assessment.enableRecording,
//                 },
//             },
//         });
//     } catch (error: any) {
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// };

// export const submitAnswer = async (req: AuthRequest, res: Response) => {
//     try {
//         const { userAssessmentId, questionId, answer, timeTaken } = req.body;

//         const userAssessment = await userAssessmentModel.findOne({
//             userAssessmentId,
//             userId: req.user?.userId,
//         });

//         if (!userAssessment) {
//             return res.status(404).json({ message: 'User assessment not found' });
//         }

//         if (userAssessment.status !== 'in-progress') {
//             return res.status(400).json({ message: 'Assessment is not in progress' });
//         }

//         // Find the question
//         const question = await questionModel.findOne({ questionId });
//         if (!question) {
//             return res.status(404).json({ message: 'Question not found' });
//         }

//         // Update or add answer
//         const existingAnswerIndex = userAssessment.answers.findIndex(
//             (a: any) => a.questionId === questionId
//         );

//         const answerData: any = {
//             questionId,
//             type: question.type,
//             answer,
//             timeTaken,
//             submittedAt: new Date(),
//         };

//         // For MCQ, check if correct
//         if (question.type === 'mcq') {
//             const correctAnswers = question.options
//                 ?.filter((opt: any) => opt.isCorrect)
//                 .map((opt: any) => opt.id);

//             if (Array.isArray(answer)) {
//                 answerData.isCorrect = answer.every((a) => correctAnswers?.includes(a));
//             } else {
//                 answerData.isCorrect = correctAnswers?.includes(answer);
//             }

//             // Calculate marks
//             if (answerData.isCorrect) {
//                 answerData.marksObtained = question.marks;
//             } else if (question.negativeMarks) {
//                 answerData.marksObtained = -question.negativeMarks;
//             }
//         }

//         // For coding questions, we'll evaluate later
//         if (question.type === 'coding') {
//             answerData.code = answer;
//             answerData.language = question.language;
//         }

//         if (existingAnswerIndex >= 0) {
//             userAssessment.answers[existingAnswerIndex] = answerData;
//         } else {
//             userAssessment.answers.push(answerData);
//         }

//         await userAssessment.save();

//         // Update session last activity
//         await sessionModel.findOneAndUpdate(
//             { userAssessmentId },
//             { lastActive: new Date() }
//         );

//         res.json(userAssessment);
//     } catch (error: any) {
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// };

// export const completeAssessment = async (req: AuthRequest, res: Response) => {
//     try {
//         const { userAssessmentId, recordingUrl, violations } = req.body;

//         const userAssessment = await userAssessmentModel.findOne({
//             userAssessmentId,
//             userId: req.user?.userId,
//         });

//         if (!userAssessment) {
//             return res.status(404).json({ message: 'User assessment not found' });
//         }

//         if (userAssessment.status !== 'in-progress') {
//             return res.status(400).json({ message: 'Assessment is not in progress' });
//         }

//         // Calculate total score for auto-graded questions
//         let totalScore = 0;
//         userAssessment.answers.forEach((answer: any) => {
//             if (answer.type === 'mcq' && answer.marksObtained !== undefined) {
//                 totalScore += answer.marksObtained;
//             }
//         });

//         userAssessment.status = 'completed';
//         userAssessment.completedAt = new Date();
//         userAssessment.score = totalScore;
//         userAssessment.recordingUrl = recordingUrl;
//         userAssessment.violations = violations || [];
//         userAssessment.isPassed = totalScore >= userAssessment.totalMarks * 0.6; // 60% passing

//         await userAssessment.save();

//         // End session
//         await sessionModel.findOneAndUpdate(
//             { userAssessmentId },
//             {
//                 endTime: new Date(),
//                 isActive: false,
//                 recordingComplete: true,
//             }
//         );

//         res.json(userAssessment);
//     } catch (error: any) {
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// };

// export const getAssessmentQuestions = async (req: Request, res: Response) => {
//     try {
//         const assessment = await assessmentModel.findOne({
//             assessmentId: req.params.id,
//         });

//         if (!assessment) {
//             return res.status(404).json({ message: 'Assessment not found' });
//         }

//         // Get full question details
//         const questionIds = assessment.questions.map((q: any) => q.questionId);
//         const questions = await questionModel.find({ questionId: { $in: questionIds } });

//         // Map questions with their order from assessment
//         const orderedQuestions = assessment.questions.map((aq: any) => {
//             const question = questions.find((q: any) => q.questionId === aq.questionId);
//             return {
//                 ...question?.toObject(),
//                 index: aq.index,
//             };
//         });

//         res.json(orderedQuestions);
//     } catch (error: any) {
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// };

// export const evaluateCodingAnswer = async (req: AuthRequest, res: Response) => {
//     try {
//         const { userAssessmentId, questionId, code, language } = req.body;

//         const userAssessment = await userAssessmentModel.findOne({ userAssessmentId });
//         if (!userAssessment) {
//             return res.status(404).json({ message: 'User assessment not found' });
//         }

//         const question = await questionModel.findOne({ questionId });
//         if (!question || question.type !== 'coding') {
//             return res.status(404).json({ message: 'Coding question not found' });
//         }

//         // TODO: Implement code execution service
//         // This would connect to a code execution service
//         // For now, return mock results

//         const mockResults = {
//             passedTestCases: question.testCases?.filter((tc: any) => tc.isPublic).length || 0,
//             totalTestCases: question.testCases?.length || 0,
//             executionTime: '1.2s',
//             memoryUsed: '12MB',
//             score: 0,
//         };

//         // Update the answer in user assessment
//         const answerIndex = userAssessment.answers.findIndex(
//             (a: any) => a.questionId === questionId
//         );

//         if (answerIndex >= 0) {
//             userAssessment.answers[answerIndex] = {
//                 ...userAssessment.answers[answerIndex],
//                 testResults: mockResults,
//                 marksObtained: mockResults.score,
//                 evaluated: true,
//             };
//         }

//         await userAssessment.save();
//         res.json(mockResults);
//     } catch (error: any) {
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// };