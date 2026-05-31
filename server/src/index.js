import express          from 'express';
import http             from 'http';
import cors             from 'cors';
import dotenv           from 'dotenv';
import connectDB        from './db/connect.js';
import { initSocket }   from './socket.js';
import roomsRouter      from './routes/rooms.js';
import executeRouter    from './routes/execute.js';
import { errorHandler } from './middleware/errorHandler.js';
import { flushAllPendingWrites } from './handlers/codeSync.js';

dotenv.config();

const app        = express();
const httpServer = http.createServer(app);

// ── CORS — allow both local dev and production frontend ───────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean); // remove undefined/empty

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In development, allow all localhost origins
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true);
    }

    console.warn(`[CORS] Blocked: ${origin}`);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  methods:     ['GET', 'POST', 'OPTIONS'],
  credentials: true,
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '1mb' }));

app.use('/api/rooms',   roomsRouter);
app.use('/api/execute', executeRouter);

app.get('/', (req, res) => {
  res.json({ name: 'CodeRoom API', status: 'running', version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
    env:       process.env.NODE_ENV || 'development',
  });
});

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.url} not found` });
});

app.use(errorHandler);
initSocket(httpServer);

const PORT = process.env.PORT || 3001;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});

const shutdown = async (signal) => {
  console.log(`\n[Server] ${signal} — flushing writes...`);
  try {
    await flushAllPendingWrites();
    console.log('[Server] Done. Shutting down.');
  } catch (err) {
    console.error('[Server] Flush error:', err);
  }
  process.exit(0);
};

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));