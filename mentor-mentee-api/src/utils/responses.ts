import { Response } from 'express';

export interface ApiError {
  code: 'VALIDATION_ERROR' | 'AUTH_ERROR' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL';
  message: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
}

export const success = <T>(res: Response, data: T, statusCode: number = 200): Response => {
  return res.status(statusCode).json({ data });
};

export const error = (
  res: Response,
  code: ApiError['code'],
  message: string,
  details?: any,
  statusCode: number = 400
): Response => {
  return res.status(statusCode).json({
    error: {
      code,
      message,
      details: details || null,
    },
  });
};

// Common error responses
export const validationError = (res: Response, message: string, details?: any): Response => {
  return error(res, 'VALIDATION_ERROR', message, details, 400);
};

export const authError = (res: Response, message: string = 'Authentication failed'): Response => {
  return error(res, 'AUTH_ERROR', message, null, 401);
};

export const notFoundError: (res: Response, message?: string) => Response = (res: Response, message: string = 'Resource not found'): Response => {
  return error(res, 'NOT_FOUND', message, null, 404);
};

export const conflictError = (res: Response, message: string, details?: any): Response => {
  return error(res, 'CONFLICT', message, details, 409);
};

export const internalError = (res: Response, message: string = 'Internal server error'): Response => {
  return error(res, 'INTERNAL', message, null, 500);
};
