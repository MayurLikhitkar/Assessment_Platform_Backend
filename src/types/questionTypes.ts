export enum ProgrammingLanguage {
    JAVASCRIPT = 'javascript',
    TYPESCRIPT = 'typescript',
    PYTHON = 'python',
    JAVA = 'java',
    CPP = 'cpp',
    CSHARP = 'csharp',
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

export interface ITestCase {
    input: string;
    expectedOutput: string;
    isPublic: boolean;
}

export interface IOption {
    text: string;
    isCorrect: boolean;
}

export interface IMcqFields {
    options: IOption[];
    isMultiSelect: boolean;
}

export interface ICodingFields {
    programmingLanguages: ProgrammingLanguage[];
    starterCode?: Partial<Record<ProgrammingLanguage, string>>;
    solutionCode?: Partial<Record<ProgrammingLanguage, string>>;
    testCases: ITestCase[];
    constraints?: string[];
    memoryLimitInMB: number;
}

export interface IQueryFields {
    databaseType: DatabaseType;
    databaseSchema?: string;
    sampleData?: string;
    expectedQuery: string;
    allowedKeywords?: string[];
    forbiddenKeywords?: string[];
}

export interface ISubjectiveFields {
    minLength: number;
    maxLength: number;
    expectedKeywords: string[];
    sampleAnswer?: string;
}

import { IQuestion } from "../models/questionModel";

export type QuestionSortableFields = Pick<IQuestion, 'createdAt' | 'difficulty' | 'marks' | 'timeLimitInSeconds'>;

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