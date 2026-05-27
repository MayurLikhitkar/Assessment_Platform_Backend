import { IQuestion } from "../models/questionModel";


export enum ProgrammingLanguage {
    JAVASCRIPT = 'javascript',
    TYPESCRIPT = 'typescript',
    PYTHON = 'python',
    JAVA = 'java',
    CPP = 'c++',
    CSHARP = 'c#',
    R = 'r',
    SQL = 'sql',
    HTML = 'html',
    CSS = 'css'
}

export enum QuestionType {
    MCQ = 'mcq',
    CODING = 'coding',
    QUERY = 'query',
    SUBJECTIVE = 'subjective',
}

export enum Difficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard',
}

export enum DatabaseType {
    MYSQL = 'mysql',
    POSTGRESQL = 'postgresql',
    MONGODB = 'mongodb',
    SQLITE = 'sqlite',
}

export type QuestionSortableFields = Pick<IQuestion, 'createdAt' | 'difficulty' | 'marks' | 'timeLimitInSeconds' | 'memoryLimitInMB'>;

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