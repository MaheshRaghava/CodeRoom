import { EVENTS } from '../../../shared/constants.js';
import Message from '../models/Message.js';

export const registerChat = (io, socket) => {

  // New chat message from a client
  socket.on(EVENTS.CHAT_MESSAGE, async ({ roomId, username, color, text }) => {
    if (!roomId || !text?.trim()) return;

    const sanitized = text.trim().slice(0, 500);

    try {
      // Persist to MongoDB
      const message = await Message.create({
        roomId,
        username,
        color,
        text: sanitized,
        type: 'message',
      });

      // Broadcast to everyone in the room INCLUDING sender
      io.to(roomId).emit(EVENTS.CHAT_MESSAGE, {
        _id:       message._id,
        username:  message.username,
        color:     message.color,
        text:      message.text,
        type:      message.type,
        createdAt: message.createdAt,
      });

    } catch (err) {
      console.error('Chat message error:', err);
    }
  });

  // Client requests chat history when joining
  socket.on(EVENTS.CHAT_HISTORY, async ({ roomId }) => {
    if (!roomId) return;

    try {
      // Last 50 messages, oldest first
      const messages = await Message.find({ roomId })
        .sort({ createdAt: 1 })
        .limit(50)
        .lean();

      socket.emit(EVENTS.CHAT_HISTORY, { messages });

    } catch (err) {
      console.error('Chat history error:', err);
      socket.emit(EVENTS.CHAT_HISTORY, { messages: [] });
    }
  });
};