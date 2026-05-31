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

app.use(cors({
  origin:      process.env.CLIENT_URL,
  methods:     ['GET', 'POST'],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

app.use('/api/rooms',   roomsRouter);
app.use('/api/execute', executeRouter);

app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
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
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});

// ── Graceful shutdown ─────────────────────────────────────────────────────
// Flush pending DB writes before process exits
// so code typed just before Ctrl+C is not lost
const shutdown = async (signal) => {
  console.log(`\n[Server] ${signal} received — flushing pending writes...`);
  try {
    await flushAllPendingWrites();
    console.log('[Server] All writes flushed. Shutting down.');
  } catch (err) {
    console.error('[Server] Flush error:', err);
  }
  process.exit(0);
};

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));