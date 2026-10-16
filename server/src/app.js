import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import env from './config/env.js';
import { checkDbConnection } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import { csrfProtection } from './middlewares/csrfMiddleware.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { NotFoundError } from './utils/errors.js';

export const app = express();

// 1. Security HTTP Headers
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  })
);

// 2. Cross-Origin Resource Sharing
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true, // Allow cookies across origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 3. Body & Cookie Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser(env.COOKIE_SECRET));

// 4. Server-Side CSRF and Origin Guard
app.use(csrfProtection);

// 4. Service Health Check Endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = await checkDbConnection();
  const statusCode = dbStatus.connected ? 200 : 503;

  return res.status(statusCode).json({
    status: dbStatus.connected ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    environment: env.NODE_ENV,
  });
});

// 5. Mount Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);

// 6. Catch-all 404 for undefined routes
app.use('*', (req, res, next) => {
  next(new NotFoundError(`Endpoint '${req.originalUrl}' does not exist on this server`));
});

// 7. Centralized Operational Error Handler
app.use(errorHandler);

export default app;
