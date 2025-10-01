const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  messages: [{
    type: {
      type: String,
      enum: ['user', 'ai', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    inputType: {
      type: String,
      enum: ['text', 'image', 'voice', 'screenshot'],
      default: 'text'
    },
    metadata: {
      imageUrl: String,
      voiceUrl: String,
      analysis: mongoose.Schema.Types.Mixed
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'paused', 'completed'],
    default: 'active'
  },
  totalMessages: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
conversationSchema.index({ userId: 1, status: 1 });
conversationSchema.index({ profileId: 1 });

// Update lastActivity on message addition
conversationSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastActivity = new Date();
    this.totalMessages = this.messages.length;
  }
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);
