import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import routes from './routes/index.js';
import correlationId from './middleware/correlationId.js';
import errorHandler from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';
import logger from './utils/logger.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || '*', credentials: true }));

app.use(correlationId());

app.use(
  pinoHttp({
    logger: logger.child({ component: 'http' }),
    autoLogging: process.env.NODE_ENV !== 'test',
    genReqId: (req) => req.id,
    customProps: (req) => ({
      requestId: req.id,
      userId: req.user?.id ?? null,
    }),
    customLogLevel: (res, err) => {
      if (err || res.statusCode >= 500) {
        return 'error';
      }
      if (res.statusCode >= 400) {
        return 'warn';
      }
      return 'info';
    },
    quietReqLogger: process.env.NODE_ENV === 'test',
  }),
);

const bodyLimit = process.env.REQUEST_BODY_LIMIT || '1mb';
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 300);
const limiter = rateLimit({
  windowMs,
  max: Number.isNaN(maxRequests) ? 300 : maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests, please try again later.',
  },
  skip: (req) => req.path.startsWith('/health'),
});
app.use(limiter);

app.use('/health', healthRouter);

app.use('/api', routes);

app.use(errorHandler);

export default app;
