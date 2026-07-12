import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

/**
 * Attach a unique request ID to every request and response.
 * Makes tracing logs for specific requests easy.
 */
export const requestId = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const id = (req.headers['x-request-id'] as string) ?? uuidv4();
  (req as any).requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
};

/**
 * Morgan HTTP access log stream → Winston logger
 */
const morganStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};

/**
 * HTTP request logger using Morgan (Apache combined format condensed)
 */
export const httpLogger = morgan(
  ':remote-addr :method :url :status :res[content-length] - :response-time ms',
  { stream: morganStream },
);
