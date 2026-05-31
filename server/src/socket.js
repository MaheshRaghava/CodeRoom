import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { registerCodeSync }   from './handlers/codeSync.js';
import { registerCursorSync } from './handlers/cursorSync.js';
import { registerPresence }   from './handlers/presence.js';
import { registerChat }       from './handlers/chat.js';

dotenv.config();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
          return callback(null, true);
        }
        return callback(new Error(`Socket CORS blocked: ${origin}`));
      },
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout:       60000,
    pingInterval:      25000,
    maxHttpBufferSize: 1e6,
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    registerPresence(io, socket);
    registerCodeSync(io, socket);
    registerCursorSync(io, socket);
    registerChat(io, socket);

    socket.on('heartbeat', () => {
      socket.emit('heartbeat_ack');
    });

    const heartbeat = setInterval(() => {
      if (socket.connected) socket.emit('server_ping');
      else clearInterval(heartbeat);
    }, 20000);

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} — ${reason}`);
      clearInterval(heartbeat);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};