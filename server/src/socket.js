import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { registerCodeSync }   from './handlers/codeSync.js';
import { registerCursorSync } from './handlers/cursorSync.js';
import { registerPresence }   from './handlers/presence.js';
import { registerChat }       from './handlers/chat.js';

dotenv.config();

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:  process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
    },
    // Keep connections alive
    pingTimeout:  60000,
    pingInterval: 25000,
    // Allow larger payloads (Monaco can send large code)
    maxHttpBufferSize: 1e6,
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    registerPresence(io, socket);
    registerCodeSync(io, socket);
    registerCursorSync(io, socket);
    registerChat(io, socket);

    // Respond to client heartbeat
    socket.on('heartbeat', () => {
      socket.emit('heartbeat_ack');
    });

    // Keep-alive ping from server side
    const heartbeat = setInterval(() => {
      if (socket.connected) {
        socket.emit('server_ping');
      } else {
        clearInterval(heartbeat);
      }
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