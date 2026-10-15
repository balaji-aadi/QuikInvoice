import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import env from '../config/env.js';

/**
 * Global operational and programming error handler
 */
export function errorHandler(err, req, res, next) {
  // If response headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // 1. Handle Zod schema validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: formattedErrors,
      },
    });
  }

  // 2. Handle known operational application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.name,
        details: err.details,
      },
    });
  }

  // 3. Handle malformed JSON body parser syntax errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Malformed JSON payload in request body',
        code: 'INVALID_JSON',
      },
    });
  }

  // 4. Handle MySQL Duplicate Entry errors (e.g. unique constraint violation)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: {
        message: 'A record with this unique identifier already exists',
        code: 'DUPLICATE_ENTRY',
      },
    });
  }

  // 5. Unhandled / Unexpected internal server errors
  console.error('💥 [CRITICAL ERROR]:', err);

  const response = {
    success: false,
    error: {
      message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      code: 'INTERNAL_SERVER_ERROR',
    },
  };

  if (env.NODE_ENV !== 'production') {
    response.error.stack = err.stack;
  }

  return res.status(500).json(response);
}

export default errorHandler;
