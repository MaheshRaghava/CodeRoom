import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// Max 10 code executions per IP per minute
export const executionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error:
      'Too many execution requests. Please wait a moment before running again.',
  },

  keyGenerator: (req) => {
    const roomId = req.body?.roomId || 'unknown';

    // IPv6-safe IP + roomId
    return `${ipKeyGenerator(req)}-${roomId}`;
  },
});