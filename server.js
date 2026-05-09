import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import { testConnection } from './config/database.js';
import authRoutes from './routes/auth.js';
import exerciseRoutes from './routes/exercises.js';
import { defaultLimiter } from './middleware/rateLimit.js';
import { ensureActivityTrackingColumns, startInactivityReminderJob } from './utils/activityService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL;

app.set('trust proxy', 1);

const getAllowedOrigins = () => {
  const origins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://dashboard.shopsheap.online',
    'https://api.shopsheap.online',
  ];

  if (FRONTEND_URL) {
    const urls = FRONTEND_URL.split(',').map((url) => url.trim());
    origins.push(...urls);
  }

  const uniqueOrigins = [...new Set(origins)];
  console.log('Allowed CORS origins:', uniqueOrigins);
  return uniqueOrigins;
};

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    if (!origin) {
      console.log('Request with no origin - allowing');
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      console.log(`CORS allowed for origin: ${origin}`);
      callback(null, true);
    } else {
      console.log(`CORS blocked for origin: ${origin}`);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(defaultLimiter);
app.use(morgan('combined'));

app.get('/', (req, res) => {
  res.json({
    message: 'Dashboard Backend API dang chay',
    status: 'success',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);

app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed by CORS policy',
      origin: req.headers.origin
    });
  }

  return res.status(err.status || 500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

app.listen(PORT, async () => {
  console.log(`Server dang chay tai http://localhost:${PORT}`);
  console.log('Testing database connection...');

  const dbConnected = await testConnection();

  if (!dbConnected) {
    return;
  }

  try {
    await ensureActivityTrackingColumns();
    await startInactivityReminderJob();
    console.log('Activity tracking and inactivity reminder job are ready');
  } catch (error) {
    console.error('Failed to initialize activity tracking:', error.message);
  }
});
