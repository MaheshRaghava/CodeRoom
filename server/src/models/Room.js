import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
    },
    name: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: 50,
    },
    code: {
      type:    String,
      default: '',
    },
    language: {
      type:    String,
      default: 'javascript',
      enum:    ['javascript', 'typescript', 'python', 'rust', 'go', 'cpp', 'java'],
    },
    // Plain Object instead of Map — avoids schema conflicts with existing docs
    perLanguageCode: {
      type:    Object,
      default: {},
    },
    createdBy: {
      type:     String,
      required: true,
      trim:     true,
    },
    participants: [
      {
        username: String,
        socketId: String,
        joinedAt: { type: Date, default: Date.now },
        color:    String,
      },
    ],
    expiresAt: {
      type:    Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
    // Allow fields not in schema (like perLanguageCode entries) to be stored
    strict: false,
  }
);

roomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Room = mongoose.model('Room', roomSchema);
export default Room;