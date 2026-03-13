import { Request, Response, NextFunction } from 'express';

// Structured error response type
interface ErrorResponse {
  error: {
    message: string;
    code: string;
    status: number;
  };
}

// Global error handler — catches all unhandled errors
export const errorHandler = (
  err: Error & { status?: number; code?: string },
  _req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction
): void => {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = status === 500 ? 'Internal server error' : err.message;

  // Log the full error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${code}] ${err.message}`, err.stack);
  } else {
    console.error(`[${code}] ${err.message}`);
  }

  res.status(status).json({
    error: {
      message,
      code,
      status,
    },
  });
};
