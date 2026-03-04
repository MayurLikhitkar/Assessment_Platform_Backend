import { NextFunction, Response } from "express";
import { CustomRequest } from "../types/authTypes";
import { HttpStatus, MESSAGE } from "../utils/constants";
import { errorResponse } from "../utils/responseHandler";

const validatePayload = (request: CustomRequest, response: Response, next: NextFunction) => {
    const payload = request.user;
    if (!payload) {
        return response.status(HttpStatus.UNAUTHORIZED).json(errorResponse('Authentication required', MESSAGE.PAYLOAD_MISSING_OR_INVALID));
    }
    next();
};

export default validatePayload;