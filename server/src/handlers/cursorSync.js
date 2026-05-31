import { EVENTS } from '../../../shared/constants.js';

export const registerCursorSync = (io, socket) => {

  socket.on(EVENTS.CURSOR_MOVE, ({ roomId, username, color, position }) => {
    if (!roomId) return;
    
    console.log(`📡 Server: ${username} cursor at line ${position.lineNumber}`);
    
    socket.to(roomId).emit(EVENTS.CURSOR_UPDATE, {
      socketId: socket.id,
      username,
      color,
      position,
    });
  });
};