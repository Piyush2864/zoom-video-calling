import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export function errorMiddleware(
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
  }

  res.status(statusCode).json({
    success: false,
    message,
    details,
    ...(env.NODE_ENV === 'development' && !(err instanceof ApiError)
      ? { stack: err.stack }
      : {}),
  });
}

export function notFoundMiddleware(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
}
