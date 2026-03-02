import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { HttpStatus } from "../utils/constants";
import logger from "../utils/logger";

const validate = (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        logger.debug('Validation result', { errors: errors.array() });
        const errorMessages = errors
            .array()
            .map((error) => error.msg)
            .join(", ");
        return response.status(HttpStatus.BAD_REQUEST).json({
            success: false,
            message: errorMessages,
        });
    }
    next();
};

export default validate;