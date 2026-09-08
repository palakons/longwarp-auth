import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import shabuRouter from './routes/shabu';

export const createApp = () => {
  const app = express();

  // Middleware
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS setup for cross-subdomain authentication
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, same-origin)
        if (!origin) {
          return callback(null, true);
        }

        try {
          const url = new URL(origin);
          const isAllowedHost =
            config.cors.allowedOrigins.includes(origin) ||
            url.hostname === 'longwarp.com' ||
            url.hostname.endsWith('.longwarp.com') ||
            url.hostname === 'localhost' ||
            url.hostname === '127.0.0.1';

          if (isAllowedHost) {
            return callback(null, true);
          }
        } catch {
          // Fall through
        }

        return callback(new Error(`CORS policy does not allow access from ${origin}`));
      },
      credentials: true,
    })
  );

  // Routes
  app.use(healthRouter);
  app.use(authRouter);
  app.use(shabuRouter);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource does not exist.',
    });
  });

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred.',
    });
  });

  return app;
};

export default createApp;
