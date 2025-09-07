import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { validationError } from '../utils/responses';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error: any) {
      if (error.errors) {
        const details = error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return validationError(res, 'Validation failed', details);
      }
      return validationError(res, 'Invalid input data');
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData as any;
      next();
    } catch (error: any) {
      if (error.errors) {
        const details = error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return validationError(res, 'Query validation failed', details);
      }
      return validationError(res, 'Invalid query parameters');
    }
  };
};
