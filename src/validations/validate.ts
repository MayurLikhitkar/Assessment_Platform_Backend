import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { HttpStatus } from "../utils/constants";
import logger from "../utils/logger";
import { errorResponse } from "../utils/responseHandler";

const validate = (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        const errorDetails = errors.array().map((e) => `${e.type === 'field' ? e.path : 'unknown'}: ${e.msg}`);
        logger.debug(`Validation failed ———> ${errorDetails.join('\n')}`);
        const errorMessages = errors
            .array()
            .map((error) => error.msg)
            .join(", ");
        return response.status(HttpStatus.BAD_REQUEST).json(errorResponse('Validation failed', errorMessages, errors.array()));
    }
    next();
};

export default validate;