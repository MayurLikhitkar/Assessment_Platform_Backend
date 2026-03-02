import { NextFunction, Request, Response } from "express"
import { HttpStatus } from "../utils/constants";
import logger from "../utils/logger";

const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof Error) {
        console.error("Error Stack ====>", err.stack)
        logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, {
            stack: err.stack,
            method: req.method,
            url: req.originalUrl,
        });
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: err.message || 'Something went wrong!', success: false, error: err })
    }
    console.error("Error in error handler ====>", err)
    logger.error(`${req.method} ${req.originalUrl} — Unhandled error`, {
        error: err,
        method: req.method,
        url: req.originalUrl,
    });
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Something went wrong!', success: false, error: err })
}

export default errorHandler;