import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';

import { initializeFirebaseAdmin } from './config/firebaseAdmin.js';
import userRoutes from './routes/users.js';
import friendRoutes from './routes/friends.js';
import studyRoomRoutes from './routes/studyRooms.js';
import notificationRoutes from './routes/notifications.js';
import focusSessionRoutes from './routes/focusSessions.js';
import { initializeSocket } from './socket/index.js';

const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);
const allowedOrigins = (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',').map((item) => item.trim()).filter(Boolean);

const originAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Optional Vercel preview support, restricted to Vercel's HTTPS hostnames.
  return /^https:\/\/[a-z0-9-]+(-[a-z0-9-]+)*\.vercel\.app$/i.test(origin)
    && process.env.ALLOW_VERCEL_PREVIEWS === 'true';
};

app.use(cors({
  origin(origin, callback) {
    if (originAllowed(origin)) callback(null, true);
    else callback(new Error('Origin is not allowed by Dynamite CORS.'));
  },
  credentials: false,
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 180, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/api/health', (_req, res) => res.json({ success: true, service: 'dynamite-api', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/study-rooms', studyRoomRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/focus-sessions', focusSessionRoutes);

app.use((error, _req, res, _next) => {
  console.error('[API]', error.message);
  const status = error.status || error.statusCode || 500;
  res.status(status).json({ success: false, error: status >= 500 ? 'Something went wrong on the server.' : error.message });
});
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found.' }));

const io = new Server(httpServer, {
  cors: {
    origin(origin, callback) {
      if (originAllowed(origin)) callback(null, true);
      else callback(new Error('Origin is not allowed by Dynamite Socket.IO CORS.'));
    },
    methods: ['GET', 'POST'],
  },
  pingInterval: 25000,
  pingTimeout: 20000,
});
initializeSocket(io);

const port = Number(process.env.PORT || 3000);

async function start() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required. Copy server/.env.example to server/.env and configure it.');
  initializeFirebaseAdmin();
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[MongoDB] Connected.');
  httpServer.listen(port, '0.0.0.0', () => console.log(`[Dynamite API] Listening on ${port}`));
}

start().catch((error) => {
  console.error('[Dynamite API] Startup failed:', error.message);
  process.exit(1);
});

export { app, io };
