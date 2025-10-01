const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetPerson: {
    name: String,
    personality: {
      type: String,
      enum: ['introvert', 'extrovert', 'ambivert', 'unknown'],
      default: 'unknown'
    },
    relationship: {
      type: String,
      enum: ['stranger', 'acquaintance', 'friend', 'colleague', 'classmate', 'online'],
      default: 'stranger'
    },
    context: {
      type: String,
      enum: ['online', 'offline', 'college', 'work', 'social', 'dating_app'],
      default: 'online'
    },
    interests: [String],
    age: Number,
    occupation: String,
    location: String,
    notes: String
  },
  conversationStyle: {
    tone: {
      type: String,
      enum: ['casual', 'flirty', 'romantic', 'funny', 'intellectual', 'mysterious'],
      default: 'casual'
    },
    approach: {
      type: String,
      enum: ['direct', 'subtle', 'playful', 'sincere', 'teasing'],
      default: 'subtle'
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  conversationHistory: [{
    type: {
      type: String,
      enum: ['text', 'image', 'voice', 'screenshot'],
      required: true
    },
    content: String,
    response: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    success: {
      type: Boolean,
      default: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
profileSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Profile', profileSchema);
