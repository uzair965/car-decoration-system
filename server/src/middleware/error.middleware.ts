import { Request, Response, NextFunction } from 'express';

// ==================================================
// Custom error class with HTTP status code
// ==================================================
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguish from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

// ==================================================
// Global error handler middleware
// ==================================================
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Default values
  let statusCode = 500;
  let message = 'Internal Server Error';

  // If it's our custom AppError, use its status code and message
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    // Zod or Prisma validation errors
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if ((err as any).code === 'P2002') {
    // Prisma unique constraint violation
    statusCode = 409;
    const target = (err as any).meta?.target;
    message = `A record with this ${target?.join(', ') || 'value'} already exists`;
  } else if ((err as any).code === 'P2025') {
    // Prisma record not found
    statusCode = 404;
    message = 'Record not found';
  } else if (err.message === 'Only image files (JPEG, PNG, WebP, GIF) are allowed') {
    // Multer file type error
    statusCode = 400;
    message = err.message;
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`\n❌ Error [${statusCode}]: ${message}`);
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
