import { IAssessment } from "../models/assessmentModel";

export enum AssessmentType {
    APTITUDE = 'aptitude',
    CODING = 'coding',
    QUERY = 'query',
    SUBJECTIVE = 'subjective',
    MCQ = 'mcq',
}

export enum AssessmentDifficulty {
    BEGINNER = 'beginner',
    INTERMEDIATE = 'intermediate',
    ADVANCED = 'advanced',
    EXPERT = 'expert',
}

export type AssessmentSortableFields = Pick<IAssessment, 'createdAt' | 'title' | 'difficulty' | 'durationInMinutes' | 'startDate' | 'endDate'>;

export interface GetAssessmentQuery {
    search?: string;
    type?: AssessmentType;
    difficulty?: AssessmentDifficulty;
    isActive?: boolean;
    isPublic?: boolean;
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    sortBy?: keyof AssessmentSortableFields;
    sortOrder?: 'asc' | 'desc';
}