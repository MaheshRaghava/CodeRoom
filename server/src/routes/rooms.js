import { Router } from 'express';
import { nanoid } from 'nanoid';
import Room from '../models/Room.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.trim().length === 0)
      return res.status(400).json({ error: 'Username is required' });

    if (username.trim().length > 20)
      return res.status(400).json({ error: 'Username must be under 20 characters' });

    const roomId = nanoid(6);

    const room = await Room.create({
      roomId,
      name:            `${username.trim()}'s Room`,
      createdBy:       username.trim(),
      perLanguageCode: {}, // explicitly initialize as empty object
    });

    res.status(201).json({
      roomId:    room.roomId,
      name:      room.name,
      language:  room.language,
      createdBy: room.createdBy,
      expiresAt: room.expiresAt,
    });
  } catch (error) {
    // Log full error
    console.error('Create room error:', error.message);
    console.error(error.stack);
    res.status(500).json({ error: 'Failed to create room', detail: error.message });
  }
});

router.get('/:roomId', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room)
      return res.status(404).json({ error: 'Room not found or expired' });

    res.json({
      roomId:           room.roomId,
      name:             room.name,
      language:         room.language,
      code:             room.code,
      createdBy:        room.createdBy,
      expiresAt:        room.expiresAt,
      participantCount: room.participants.length,
    });
  } catch (error) {
    console.error('Get room error:', error.message);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

router.get('/:roomId/check-username', async (req, res) => {
  try {
    const { roomId }   = req.params;
    const { username } = req.query;

    if (!username)
      return res.status(400).json({ error: 'Username required' });

    const room = await Room.findOne({ roomId });
    if (!room)
      return res.status(404).json({ error: 'Room not found' });

    const taken = room.participants.some(
      (p) => p.username.toLowerCase() === username.trim().toLowerCase()
    );

    res.json({ available: !taken, username: username.trim() });
  } catch (error) {
    console.error('Check username error:', error.message);
    res.status(500).json({ error: 'Failed to check username' });
  }
});

export default router;