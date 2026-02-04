interface ApiSuccessResponse<T = unknown> {
    success: true;
    responseMessage: string;
    data: T | null;
}

interface ApiErrorResponse {
    success: false;
    responseMessage: string;
    errorMessage: string;
    error: unknown;
}

export const successResponse = <T = unknown>(
    responseMessage: string,
    data: T | null = null
): ApiSuccessResponse<T> => ({ success: true, responseMessage, data });

export const errorResponse = (
    responseMessage: string,
    errorMessage: string,
    error: unknown = null
): ApiErrorResponse => ({ success: false, responseMessage, errorMessage, error });
