import { Request, Response, NextFunction } from 'express';
import { internalError } from '../utils/responses';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Unhandled error:', error);
  
  // Don't log sensitive information
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;
  
  return internalError(res, message);
};
