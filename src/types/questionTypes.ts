import { QuestionType, IQuestion, Difficulty } from "../models/questionModel";

export type QuestionSortableFields = Pick<IQuestion, 'createdAt' | 'difficulty' | 'marks' | 'timeLimitInMinutes' | 'memoryLimitInMB'>;

export interface GetQuestionQuery {
    search?: string;
    type?: QuestionType;
    difficulty?: Difficulty;
    tags?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: keyof QuestionSortableFields;
    sortOrder?: 'asc' | 'desc';
}