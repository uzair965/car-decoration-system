import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from './error.middleware';

// ==================================================
// Generic validation middleware factory
// Validates request body, query, or params against a Zod schema
// ==================================================
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const result = schema.safeParse(data);

      if (!result.success) {
        // Format Zod errors into a readable message
        const errors = result.error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        const message = errors
          .map((e) => `${e.field}: ${e.message}`)
          .join(', ');

        throw new AppError(message, 400);
      }

      // Replace request data with validated + transformed data
      req[source] = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};
