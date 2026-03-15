import { Response } from 'express';
import assessmentModel, { IAssessment } from '../models/assessmentModel';
import { GetAssessmentQuery } from '../types/assessmentTypes';
import { isValidObjectId, QueryFilter, startSession, Types } from 'mongoose';
import { HttpStatus } from '../utils/constants';
import { errorResponse, successResponse } from '../utils/responseHandler';
import { CustomRequest } from '../types/authTypes';
import logger from '../utils/logger';

/** Build a createdAt date-range filter, or undefined if no dates provided */
const dateRangeFilter = (startDate?: Date, endDate?: Date) => {
    if (!startDate && !endDate) return undefined;

    const dateFilter: Record<string, Date> = {};
    if (startDate) {
        dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        dateFilter.$lte = endDateTime;
    }
    return dateFilter;
};

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

    const dateRange = dateRangeFilter(startDate, endDate);
    if (dateRange) {
        filter.createdAt = dateRange;
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
export const getAssessmentById = async (req: CustomRequest, res: Response) => {
    const { id } = req.params;

    // Use Mongoose's official utility to determine lookup strategy
    const filter: QueryFilter<IAssessment> = isValidObjectId(id)
        ? { _id: new Types.ObjectId(id as string) }       // Valid ObjectId string → look up by _id
        : { id: Number(id) }; // Otherwise → look up by numeric id

    const assessment = await assessmentModel
        .findOne(filter)
        .lean()
        .exec();

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

        const { title, description, type, difficulty, durationInMinutes, startDate, endDate, tags, instructions, requireWebcam, requireMicrophone, allowTabSwitch, maxTabSwitches, allowFullscreenExit, maxFullscreenExits, enableRecording, } = req.body as IAssessment;

        const { _id: userId } = req.user!;

        // Build and save the assessment document
        const assessment = new assessmentModel({
            title,
            description,
            type,
            difficulty,
            durationInMinutes,
            tags,
            instructions,
            startDate,
            endDate,
            createdBy: userId,
            updatedBy: userId,
            // Proctoring settings
            requireWebcam,
            requireMicrophone,
            allowTabSwitch,
            maxTabSwitches,
            allowFullscreenExit,
            maxFullscreenExits,
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

    const filter: QueryFilter<IAssessment> = isValidObjectId(id)
        ? { _id: new Types.ObjectId(id as string) }
        : { id: Number(id) };

    const assessment = await assessmentModel.findOne(filter).exec();
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
        requireWebcam, requireMicrophone, allowTabSwitch,
        maxTabSwitches, allowFullscreenExit, maxFullscreenExits, enableRecording,
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
    if (requireWebcam !== undefined) assessment.requireWebcam = requireWebcam;
    if (requireMicrophone !== undefined) assessment.requireMicrophone = requireMicrophone;
    if (allowTabSwitch !== undefined) assessment.allowTabSwitch = allowTabSwitch;
    if (maxTabSwitches !== undefined) assessment.maxTabSwitches = maxTabSwitches;
    if (allowFullscreenExit !== undefined) assessment.allowFullscreenExit = allowFullscreenExit;
    if (maxFullscreenExits !== undefined) assessment.maxFullscreenExits = maxFullscreenExits;
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

    const filter: QueryFilter<IAssessment> = isValidObjectId(id)
        ? { _id: new Types.ObjectId(id as string) }
        : { id: Number(id) };

    const assessment = await assessmentModel.findOne(filter).exec();
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
    const numericUserId = Number(userId);

    // Permission check: users can only view their own, admins can view any
    const isOwnUser = req.user!.userId === numericUserId;
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'super_admin';

    if (!isOwnUser && !isAdmin) {
        return res.status(HttpStatus.FORBIDDEN).json(
            errorResponse('Forbidden', 'You do not have permission to view these assessments')
        );
    }

    // Find the user's _id from the numeric id, then query assessments by createdBy
    const userDoc = await import('../models/userModel').then(m => m.default.findOne({ id: numericUserId }).select('_id').lean().exec());
    if (!userDoc) {
        return res.status(HttpStatus.NOT_FOUND).json(
            errorResponse('User not found', 'No user found with the given ID')
        );
    }

    const assessments = await assessmentModel
        .find({ createdBy: userDoc._id })
        .select('-__v')
        .sort({ createdAt: -1 })
        .lean()
        .exec();

    return res.status(HttpStatus.OK).json(
        successResponse('User assessments fetched successfully', assessments)
    );
};