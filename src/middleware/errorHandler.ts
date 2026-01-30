import { NextFunction, Request, Response } from "express"
import { httpStatus } from "../utils/constants";

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Error ====>", err.stack)
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Something went wrong!', success: false })
}

export default errorHandler;