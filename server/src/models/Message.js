import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type:     String,
      required: true,
      index:    true,
    },
    username: {
      type:     String,
      required: true,
      trim:     true,
    },
    color: {
      type:    String,
      default: '#4AE8A0',
    },
    text: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: 500,
    },
    type: {
      type:    String,
      enum:    ['message', 'system'],
      default: 'message',
    },
  },
  { timestamps: true } // gives us createdAt automatically
);

// Auto-delete messages after 24 hours
messageSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 24 * 60 * 60 }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;