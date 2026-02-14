import { NextFunction, Request, Response } from "express"
import { HttpStatus } from "../utils/constants";

const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    console.error("Error in error handler ====>", err)
    if (err instanceof Error) {
        console.error("Error ====>", err.stack)
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: err.message || 'Something went wrong!', success: false, error: err })
    }
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Something went wrong!', success: false, error: err })
}

export default errorHandler;