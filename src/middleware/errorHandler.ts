import { NextFunction, Request, Response } from "express"
import { HttpStatus } from "../utils/constants";
import logger from "../utils/logger";
import { errorResponse } from "../utils/responseHandler";

const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof Error) {
        console.error("Error Stack ====>", err.stack)
        logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, {
            method: req.method,
            url: req.originalUrl,
            stack: err.stack,
        });
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse('Something went wrong!', err.message, err))
    }
    console.error("Error in error handler ====>", err)
    logger.error(`${req.method} ${req.originalUrl} — Unhandled error`, {
        error: err,
        method: req.method,
        url: req.originalUrl,
    });
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse('Something went wrong!', 'Something went wrong!', err))
}

export default errorHandler;