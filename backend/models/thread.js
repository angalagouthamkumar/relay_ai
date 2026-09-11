import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const threadSchema = new mongoose.Schema({
  threadId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true
  },

  guestId: {
    type: String,
    default: null,
    index: true
  },
  title: {
    type: String,
    default: 'new chat',
    required: true
  },
  pinned: {
    type: Boolean,
    default: false
  },
  messages: {
    type: [messageSchema],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null
  }
});
threadSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const Message = mongoose.model('Message', messageSchema);
const Thread = mongoose.model('Thread', threadSchema);

export default { Message, Thread };