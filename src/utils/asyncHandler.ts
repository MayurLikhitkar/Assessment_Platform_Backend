import { RequestHandler } from 'express';

export function asyncHandler(fn: RequestHandler): RequestHandler {
    return async (req, res, next) => {
        return Promise.resolve(fn(req, res, next)).catch(next);
    };
}