import { EVENTS, USER_COLORS } from '../../../shared/constants.js';
import Room    from '../models/Room.js';
import Message from '../models/Message.js';

const connectedUsers = new Map();

export const registerPresence = (io, socket) => {

  socket.on(EVENTS.JOIN_ROOM, async ({ roomId, username }) => {
    if (!roomId || !username) return;

    const roomSockets = await io.in(roomId).fetchSockets();
    const color = USER_COLORS[roomSockets.length % USER_COLORS.length];

    socket.join(roomId);
    connectedUsers.set(socket.id, { roomId, username, color });

    // Clean stale participants + add new one
    try {
      const activeSocketIds = roomSockets.map((s) => s.id);
      await Room.findOneAndUpdate(
        { roomId },
        {
          $pull: {
            participants: {
              socketId: { $nin: [...activeSocketIds, socket.id] },
            },
          },
        }
      );
      await Room.findOneAndUpdate(
        { roomId },
        { $push: { participants: { username, socketId: socket.id, color } } }
      );
    } catch (err) {
      console.error('Presence DB update error:', err);
    }

    // ── Created vs Joined logic ───────────────────────────────────────────
    // Check if ANY message exists for this room.
    // No messages = truly first time = "created"
    // Messages exist = room has history = "joined" (even if creator rejoins)
    let systemText = `${username} joined the room`;
    try {
      const messageCount = await Message.countDocuments({ roomId });
      if (messageCount === 0) {
        // No messages at all — this is the very first join = creator
        systemText = `${username} created the room`;
      }
    } catch (err) {
      console.error('Message count error:', err);
    }

    try {
      const sysMsg = await Message.create({
        roomId,
        username: 'system',
        color:    '#5A5F75',
        text:     systemText,
        type:     'system',
      });
      io.to(roomId).emit(EVENTS.CHAT_MESSAGE, {
        _id:       sysMsg._id,
        username:  sysMsg.username,
        color:     sysMsg.color,
        text:      sysMsg.text,
        type:      sysMsg.type,
        createdAt: sysMsg.createdAt,
      });
    } catch (err) {
      console.error('System message error:', err);
    }

    const updatedSockets = await io.in(roomId).fetchSockets();
    const userList = updatedSockets.map((s) => {
      const u = connectedUsers.get(s.id);
      return {
        socketId: s.id,
        username: u?.username || 'Unknown',
        color:    u?.color    || USER_COLORS[0],
      };
    });

    io.to(roomId).emit(EVENTS.ROOM_USERS,    { users: userList });
    socket.to(roomId).emit(EVENTS.USER_JOINED, { username, color });

    console.log(`${username} ${systemText.includes('created') ? 'created' : 'joined'} room ${roomId}`);
  });

  socket.on('disconnect', async () => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const { roomId, username } = user;

    try {
      await Room.findOneAndUpdate(
        { roomId },
        { $pull: { participants: { socketId: socket.id } } }
      );
    } catch (err) {
      console.error('Presence disconnect DB error:', err);
    }

    connectedUsers.delete(socket.id);

    try {
      const sysMsg = await Message.create({
        roomId,
        username: 'system',
        color:    '#5A5F75',
        text:     `${username} left the room`,
        type:     'system',
      });
      io.to(roomId).emit(EVENTS.CHAT_MESSAGE, {
        _id:       sysMsg._id,
        username:  sysMsg.username,
        color:     sysMsg.color,
        text:      sysMsg.text,
        type:      sysMsg.type,
        createdAt: sysMsg.createdAt,
      });
    } catch (err) {
      console.error('System leave message error:', err);
    }

    socket.to(roomId).emit(EVENTS.USER_LEFT, { username, socketId: socket.id });

    const remainingSockets = await io.in(roomId).fetchSockets();
    const userList = remainingSockets.map((s) => {
      const u = connectedUsers.get(s.id);
      return {
        socketId: s.id,
        username: u?.username || 'Unknown',
        color:    u?.color    || USER_COLORS[0],
      };
    });

    io.to(roomId).emit(EVENTS.ROOM_USERS, { users: userList });

    console.log(`${username} left room ${roomId}`);

    if (remainingSockets.length === 0) {
      console.log(`Room ${roomId} is now empty`);
    }
  });
};