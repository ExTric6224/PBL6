import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { validationError } from '../utils/responses';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse arrays from form data (multer sends them as strings)
      const bodyData = { ...req.body };
      
      // Parse expertise array if present (mentor profile)
      if (bodyData.expertise && typeof bodyData.expertise === 'string') {
        try {
          bodyData.expertise = JSON.parse(bodyData.expertise);
        } catch {
          bodyData.expertise = [];
        }
      }
      
      // Parse interests array if present (mentee profile)
      if (bodyData.interests && typeof bodyData.interests === 'string') {
        try {
          bodyData.interests = JSON.parse(bodyData.interests);
        } catch {
          bodyData.interests = [];
        }
      }
      
      // Parse yearsExp to number if present
      if (bodyData.yearsExp && typeof bodyData.yearsExp === 'string') {
        bodyData.yearsExp = parseInt(bodyData.yearsExp, 10);
      }
      
      const validatedData = schema.parse(bodyData);
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
