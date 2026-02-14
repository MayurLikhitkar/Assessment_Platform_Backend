import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { HttpStatus } from "../utils/constants";

const validate = (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    const errors = validationResult(request);
    console.error('errors ====>', errors)
    if (!errors.isEmpty()) {
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