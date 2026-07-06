import { Response } from 'express';
import assessmentModel, { IAssessment } from '../models/assessmentModel';
import { GetAssessmentQuery } from '../types/assessmentTypes';
import { QueryFilter, startSession, Types } from 'mongoose';
import { HttpStatus } from '../utils/constants';
import { errorResponse, successResponse } from '../utils/responseHandler';
import { CustomRequest, UserRole } from '../types/authTypes';
import logger from '../utils/logger';
import userAssessmentModel from '../models/userAssessmentModel';
import { UserAssessmentStatus } from '../types/userAssessmentTypes';
import questionModel, { IQuestion } from '../models/questionModel';
import userModel from '../models/userModel';

/**
 * Get assessments with filtering, pagination, and search
 * @route GET /api/assessments
 * @access Private
 */
export const getAssessments = async (req: CustomRequest, res: Response) => {
    const { page = 1, limit = 10, search, difficulty, type, isActive, isPublic, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as unknown as GetAssessmentQuery;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const filter: QueryFilter<IAssessment> = {};

    if (search) {
        filter.$text = { $search: search };
    }

    if (difficulty) {
        filter.difficulty = difficulty;
    }

    if (type) {
        filter.type = type;
    }

    if (isActive !== undefined) {
        filter.isActive = isActive;
    }

    if (isPublic !== undefined) {
        filter.isPublic = isPublic;
    }

    if (startDate) {
        filter.startDate = { $gte: new Date(startDate) };
    }
    if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        filter.endDate = { $lte: endDateTime };
    }

    // const dateRange = dateRangeFilter(startDate, endDate);
    // if (dateRange) {
    //     filter.createdAt = dateRange;
    // }

    const sortOptions: Record<string, 1 | -1> = {
        [sortBy]: sortOrder === 'asc' ? 1 : -1
    };

    const [assessments, total] = await Promise.all([
        assessmentModel
            .find(filter)
            .select('-__v')
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNumber)
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

export const getAssessmentsForUser = async (req: CustomRequest, res: Response) => {
    const { page = 1, limit = 10, search, difficulty, type, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as unknown as GetAssessmentQuery;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const filter: QueryFilter<IAssessment> = { isActive: true, isPublic: true, 'questions.0': { $exists: true } };

    if (search) {
        filter.$text = { $search: search };
    }

    if (difficulty) {
        filter.difficulty = difficulty;
    }

    if (type) {
        filter.type = type;
    }

    if (startDate) {
        const start = new Date(startDate);

        filter.$or = [
            { startDate: { $gte: start } },
            { startDate: { $exists: false } }
        ];
    }
    if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        filter.endDate = { $lte: endDateTime };
    }

    const sortOptions: Record<string, 1 | -1> = {
        [sortBy]: sortOrder === 'asc' ? 1 : -1
    };

    const [assessments, total] = await Promise.all([
        assessmentModel
            .find(filter)
            .select('-__v')
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNumber)
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
                difficulty,
                type,
                startDate,
                endDate
            }
        }
    )
    );
};


export const getAssessmentQuestions = async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    const assessment = await assessmentModel.findById(id).select('questions').lean().exec();

    if (!assessment) {
        return res.status(HttpStatus.NOT_FOUND).json(
            errorResponse('Assessment not found', 'No assessment found with the given ID')
        );
    }

    const questions: IQuestion[] = await questionModel
        .find({ _id: { $in: assessment.questions } })
        .lean()
        .exec();

    return res.status(HttpStatus.OK).json(
        successResponse('Assessment questions fetched successfully', questions)
    );
}

/**
 * Get assessment by ID with populated questions
 * @route GET /api/assessments/:id
 * @access Private
 */
export const getAssessmentById = async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    const assessment = await assessmentModel.findById(id).lean().exec();

    if (!assessment) {
        return res.status(HttpStatus.NOT_FOUND).json(errorResponse('Assessment not found', 'Assessment not found'));
    }

    // Check if user has permission to view (if private)
    // if (!assessment.isPublic && assessment.createdBy?.toString() !== req.user?.userId) {
    //     // Check if user has admin role or specific permissions
    //     const hasPermission = req.user?.role === 'admin' || req.user?.role === 'instructor';
    //     if (!hasPermission) {
    //         return res.status(HttpStatus.FORBIDDEN).json(errorResponse('You do not have permission to view this assessment', 'Only two roles can view private assessments: admin and instructor'));
    //     }
    // }

    return res.status(HttpStatus.OK).json(
        successResponse('Assessment fetched successfully', assessment)
    );
};

export const getAssessmentByIdForUser = async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    const assessment = await assessmentModel.findOne({ _id: id, isActive: true, isPublic: true, 'questions.0': { $exists: true } }).lean().exec();

    if (!assessment) {
        return res.status(HttpStatus.NOT_FOUND).json(errorResponse('Assessment not found', 'Assessment not found'));
    }

    // Check if user has permission to view (if private)
    // if (!assessment.isPublic && assessment.createdBy?.toString() !== req.user?.userId) {
    //     // Check if user has admin role or specific permissions
    //     const hasPermission = req.user?.role === 'admin' || req.user?.role === 'instructor';
    //     if (!hasPermission) {
    //         return res.status(HttpStatus.FORBIDDEN).json(errorResponse('You do not have permission to view this assessment', 'Only two roles can view private assessments: admin and instructor'));
    //     }
    // }

    return res.status(HttpStatus.OK).json(
        successResponse('Assessment fetched successfully', assessment)
    );
};

/**
 * Create new assessment with validation
 * @route POST /api/assessments
 * @access Private (Instructor/Admin)
 */
export const createAssessment = async (req: CustomRequest, res: Response) => {

    // Start a database transaction
    const session = await startSession();
    session.startTransaction();

    try {

        const {
            title, description, type, difficulty, durationInMinutes,
            totalMarks, passingMarks, questions, isActive, isPublic,
            startDate, endDate, tags, instructions,
            webcam, microphone, tabSwitch, fullscreenExit, enableRecording,
        } = req.body as IAssessment;

        const { _id: userId } = req.user!;

        // Build and save the assessment document
        const assessment = new assessmentModel({
            title,
            description,
            type,
            difficulty,
            durationInMinutes,
            totalMarks,
            passingMarks,
            questions,
            isActive: isActive ?? true,
            isPublic: isPublic ?? false,
            tags,
            instructions,
            startDate,
            endDate,
            createdBy: userId,
            updatedBy: userId,
            // Proctoring settings
            webcam,
            microphone,
            tabSwitch,
            fullscreenExit,
            enableRecording,
        });

        await assessment.save({ session });
        await session.commitTransaction();

        // Populate the saved assessment for the response (outside transaction)
        const populatedAssessment = await assessmentModel
            .findById(assessment._id)
            .select('-__v')
            .lean()
            .exec();

        return res.status(HttpStatus.CREATED).json(
            successResponse('Assessment created successfully', populatedAssessment)
        );
    } catch (error) {
        await session.abortTransaction();
        throw error; // Let asyncHandler forward to the error handler
    } finally {
        session.endSession();
    }
};

/**
 * Update assessment by ID
 * @route PUT /api/assessments/:id
 * @access Private (Admin/Super Admin)
 */
export const updateAssessment = async (req: CustomRequest, res: Response) => {
    const { id } = req.params;

    const assessment = await assessmentModel.findById(id).exec();
    if (!assessment) {
        return res.status(HttpStatus.NOT_FOUND).json(
            errorResponse('Assessment not found', 'No assessment found with the given ID')
        );
    }

    // Whitelist allowed update fields — prevent overwriting system fields
    const {
        title, description, type, difficulty, durationInMinutes,
        totalMarks, passingMarks, questions,
        isActive, isPublic, startDate, endDate, tags, instructions,
        webcam, microphone, tabSwitch,
        fullscreenExit, enableRecording,
    } = req.body as Partial<IAssessment>;

    if (title !== undefined) assessment.title = title;
    if (description !== undefined) assessment.description = description;
    if (type !== undefined) assessment.type = type;
    if (difficulty !== undefined) assessment.difficulty = difficulty;
    if (durationInMinutes !== undefined) assessment.durationInMinutes = durationInMinutes;
    if (totalMarks !== undefined) assessment.totalMarks = totalMarks;
    if (passingMarks !== undefined) assessment.passingMarks = passingMarks;
    if (questions !== undefined) assessment.questions = questions;
    if (isActive !== undefined) assessment.isActive = isActive;
    if (isPublic !== undefined) assessment.isPublic = isPublic;
    if (startDate !== undefined) assessment.startDate = startDate;
    if (endDate !== undefined) assessment.endDate = endDate;
    if (tags !== undefined) assessment.tags = tags;
    if (instructions !== undefined) assessment.instructions = instructions;
    if (webcam !== undefined) assessment.webcam = webcam;
    if (microphone !== undefined) assessment.microphone = microphone;
    if (tabSwitch !== undefined) assessment.tabSwitch = tabSwitch;
    if (fullscreenExit !== undefined) assessment.fullscreenExit = fullscreenExit;
    if (enableRecording !== undefined) assessment.enableRecording = enableRecording;

    // Track who updated
    assessment.updatedBy = new Types.ObjectId(req.user!._id);

    await assessment.save();

    const updated = await assessmentModel
        .findById(assessment._id)
        .select('-__v')
        .lean()
        .exec();

    return res.status(HttpStatus.OK).json(
        successResponse('Assessment updated successfully', updated)
    );
};

/**
 * Delete assessment by ID
 * @route DELETE /api/assessments/:id
 * @access Private (Admin/Super Admin)
 */
export const deleteAssessment = async (req: CustomRequest, res: Response) => {
    const { id } = req.params;

    const assessment = await assessmentModel.findById(id).exec();
    if (!assessment) {
        return res.status(HttpStatus.NOT_FOUND).json(
            errorResponse('Assessment not found', 'No assessment found with the given ID')
        );
    }

    await assessment.deleteOne();

    logger.info(`Assessment ${assessment.id} deleted by user ${req.user!._id}`);

    return res.status(HttpStatus.OK).json(
        successResponse('Assessment deleted successfully', null)
    );
};

/**
 * Get assessments created by a specific user
 * @route GET /api/assessments/user/:userId
 * @access Private (own user or Admin/Super Admin)
 */
export const getUserAssessments = async (req: CustomRequest, res: Response) => {
    const { userId } = req.params;

    // Permission check: users can only view their own, admins can view any
    const isOwnUser = String(req.user!._id) === userId;
    const isAdmin = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.SUPER_ADMIN;

    if (!isOwnUser && !isAdmin) {
        return res.status(HttpStatus.FORBIDDEN).json(
            errorResponse('Forbidden', 'You do not have permission to view these assessments')
        );
    }

    // Find the user's _id from the numeric id, then query assessments by createdBy
    const user = await userModel.findById(userId).select('_id').lean().exec();
    if (!user) {
        return res.status(HttpStatus.NOT_FOUND).json(
            errorResponse('User not found', 'No user found with the given ID')
        );
    }

    const assessments = await assessmentModel
        .find({ createdBy: user._id })
        .select('-__v')
        .sort({ createdAt: -1 })
        .lean()
        .exec();

    return res.status(HttpStatus.OK).json(
        successResponse('User assessments fetched successfully', assessments)
    );
};

export const startAssessment = async (req: CustomRequest, res: Response) => {
    const { _id: userId } = req.user!;
    const assessmentId = req.params.id;

    const assessment = await assessmentModel.findOne({
        _id: assessmentId,
        isActive: true,
        'questions.0': { $exists: true }
    }).lean();

    if (!assessment) {
        return res.status(HttpStatus.NOT_FOUND).json(
            errorResponse('Assessment not found', 'Invalid or inactive assessment')
        );
    }

    const now = new Date();
    if (assessment.startDate && assessment.startDate > now) {
        return res.status(HttpStatus.BAD_REQUEST).json(
            errorResponse('Assessment not open yet', `This assessment starts at ${assessment.startDate}`)
        );
    }
    if (assessment.endDate && assessment.endDate < now) {
        return res.status(HttpStatus.BAD_REQUEST).json(
            errorResponse('Assessment expired', 'This assessment is no longer available')
        );
    }

    const existingUserAssessment = await userAssessmentModel.findOne({
        userId,
        assessmentId,
    });

    if (!assessment.isPublic && !existingUserAssessment) {
        return res.status(HttpStatus.FORBIDDEN).json(
            errorResponse('Access denied', 'You are not assigned to this assessment')
        );
    }

    // Check if user already has an assessment in progress
    if (existingUserAssessment) {
        if (
            existingUserAssessment.status === UserAssessmentStatus.COMPLETED ||
            existingUserAssessment.status === UserAssessmentStatus.EXPIRED ||
            existingUserAssessment.status === UserAssessmentStatus.TERMINATED
        ) {
            return res.status(HttpStatus.BAD_REQUEST).json(
                errorResponse('Assessment already done', 'Assessment is completed, expired or terminated')
            );
        }

        if (existingUserAssessment.status === UserAssessmentStatus.IN_PROGRESS) {
            return res.status(HttpStatus.OK).json(
                successResponse('Resuming the assessment from where you left off...', existingUserAssessment)
            );
        }

        const startedUserAssessment = await userAssessmentModel.findOneAndUpdate(
            {
                _id: existingUserAssessment._id,
                status: UserAssessmentStatus.ASSIGNED, // guard: only transition if still ASSIGNED
            },
            {
                $set: {
                    status: UserAssessmentStatus.IN_PROGRESS,
                    startedAt: new Date(),
                    totalMarks: assessment.totalMarks,
                },
            },
            { new: true }
        );

        if (startedUserAssessment) {
            return res.status(HttpStatus.OK).json(successResponse('Assessment started successfully', startedUserAssessment));
        }
    }

    // Create user assessment
    const userAssessment = await userAssessmentModel.create({
        userId,
        assessmentId,
        status: UserAssessmentStatus.IN_PROGRESS,
        startedAt: now,
        totalMarks: assessment.totalMarks,
        answers: [],
        createdBy: userId,
        updatedBy: userId
    });

    // Create session
    // const session = new Session({
    //     userId: userId,
    //     assessmentId: assessment._id,
    //     userAssessmentId: userAssessment._id,
    //     startTime: new Date(),
    //     lastActive: new Date(),
    //     ipAddress: req.ip,
    //     userAgent: req.headers['user-agent'],
    //     deviceInfo: {
    //         os: 'Unknown',
    //         browser: 'Unknown',
    //         screenResolution: 'Unknown',
    //     },
    // });

    // await session.save();

    return res.status(HttpStatus.CREATED).json(successResponse('Assessment started successfully', userAssessment));
};

// export const submitAnswer = async (req: CustomRequest, res: Response) => {
//     try {
//         const { userAssessmentId, questionId, answer, timeTaken } = req.body;

//         const userAssessment = await UserAssessment.findOne({
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
//         const question = await Question.findOne({ questionId });
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
//         await Session.findOneAndUpdate(
//             { userAssessmentId },
//             { lastActive: new Date() }
//         );

//         res.json(userAssessment);
//     } catch (error: any) {
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// };