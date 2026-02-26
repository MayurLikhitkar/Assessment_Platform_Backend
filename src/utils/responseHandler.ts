interface ApiSuccessResponse<T = unknown> {
    success: true;
    responseMessage: string;
    data: T | null;
    meta: any;
}

interface ApiErrorResponse {
    success: false;
    responseMessage: string;
    errorMessage: string;
    error: unknown;
}

export const successResponse = <T = unknown>(
    responseMessage: string,
    data: T | null = null,
    meta: any = null
): ApiSuccessResponse<T> => ({ success: true, responseMessage, data, meta });

export const errorResponse = (
    responseMessage: string,
    errorMessage: string,
    error: unknown = null
): ApiErrorResponse => ({ success: false, responseMessage, errorMessage, error });
