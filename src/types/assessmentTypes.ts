export interface GetAssessmentQuery {
    search?: string;
    isPublic?: boolean;
    categoryId?: number;
    type?: ('aptitude' | 'coding' | 'query' | 'subjective') | ('aptitude' | 'coding' | 'query' | 'subjective')[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    isActive?: boolean;
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}