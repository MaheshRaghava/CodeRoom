import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/env.js';

// Singleton — but only created when first needed, not on module load
let socketInstance = null;

const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL || undefined, {
      path:                  '/socket.io',
      transports:            ['websocket', 'polling'],
      reconnection:          true,
      reconnectionAttempts:  Infinity,
      reconnectionDelay:     1000,
      reconnectionDelayMax:  5000,
      timeout:               20000,
      pingTimeout:           60000,
      pingInterval:          25000,
      // Don't connect automatically — connect only when we call connect()
      autoConnect:           false,
    });

    // Keep-alive heartbeat
    setInterval(() => {
      if (socketInstance?.connected) {
        socketInstance.emit('heartbeat');
      }
    }, 20000);
  }
  return socketInstance;
};

export const useSocket = (shouldConnect = false) => {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Only connect if caller explicitly says so
    if (!shouldConnect) return;

    const socket = getSocket();
    socketRef.current = socket;

    // Connect now if not already connected
    if (!socket.connected) {
      socket.connect();
    } else {
      setConnected(true);
    }

    const onConnect      = () => { setConnected(true);  };
    const onDisconnect   = () => { setConnected(false); };
    const onConnectError = (err) => {
      console.error('[Socket] Error:', err.message);
      setConnected(false);
    };
    const onReconnect = () => { setConnected(true); };

    socket.on('connect',       onConnect);
    socket.on('disconnect',    onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.io.on('reconnect', onReconnect);

    return () => {
      socket.off('connect',       onConnect);
      socket.off('disconnect',    onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.io.off('reconnect',  onReconnect);
      // Don't disconnect — singleton persists for the session
    };
  }, [shouldConnect]);

  return { socket: socketRef.current, connected };
};

// Call this to cleanly disconnect when user leaves room
export const disconnectSocket = () => {
  if (socketInstance?.connected) {
    socketInstance.disconnect();
  }
  socketInstance = null; // Reset so next room creates fresh connection
};