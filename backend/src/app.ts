import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorMiddleware, notFoundMiddleware } from './middlewares/error.middleware';
import { globalRateLimiter } from './middlewares/rateLimiter.middleware';
import authRoutes from './modules/auth/auth.routes';

const app: Application = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(globalRateLimiter);

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

app.use('/api/v1/auth', authRoutes);



app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
