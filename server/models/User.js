const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  authMethods: {
    google: {
      id: String,
      email: String,
      name: String,
      picture: String
    },
    instagram: {
      id: String,
      username: String,
      fullName: String,
      profilePicture: String
    },
    phone: {
      verified: { type: Boolean, default: false },
      otp: String,
      otpExpires: Date
    }
  },
  profilePicture: {
    type: String,
    default: null
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'premium'],
      default: 'free'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  usage: {
    messagesThisMonth: {
      type: Number,
      default: 0
    },
    imagesThisMonth: {
      type: Number,
      default: 0
    },
    voiceMinutesThisMonth: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  },
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    theme: {
      type: String,
      default: 'light'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving (only if password exists)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if user can use feature based on subscription
userSchema.methods.canUseFeature = function(feature) {
  const limits = {
    free: {
      messages: 50,
      images: 10,
      voiceMinutes: 5
    },
    pro: {
      messages: 500,
      images: 100,
      voiceMinutes: 60
    },
    premium: {
      messages: -1, // unlimited
      images: -1, // unlimited
      voiceMinutes: -1 // unlimited
    }
  };
  
  const planLimits = limits[this.subscription.plan];
  const currentUsage = this.usage;
  
  // Reset usage if new month
  const now = new Date();
  const lastReset = new Date(currentUsage.lastResetDate);
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    this.usage.messagesThisMonth = 0;
    this.usage.imagesThisMonth = 0;
    this.usage.voiceMinutesThisMonth = 0;
    this.usage.lastResetDate = now;
    this.save();
  }
  
  const limit = planLimits[feature];
  if (limit === -1) return true; // unlimited
  
  return currentUsage[`${feature}ThisMonth`] < limit;
};

module.exports = mongoose.model('User', userSchema);
