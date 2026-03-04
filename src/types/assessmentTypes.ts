import { AssessmentDifficulty, AssessmentType, IAssessment } from "../models/assessmentModel";

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