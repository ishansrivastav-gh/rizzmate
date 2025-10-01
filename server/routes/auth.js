const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const auth = require('../middleware/auth');
const smsService = require('../services/smsService');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        subscription: user.subscription,
        usage: user.usage
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        subscription: user.subscription,
        usage: user.usage,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const { language, theme } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (language) user.preferences.language = language;
    if (theme) user.preferences.theme = theme;

    await user.save();

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check usage limits
router.get('/usage', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const limits = {
      free: { messages: 50, images: 10, voiceMinutes: 5 },
      pro: { messages: 500, images: 100, voiceMinutes: 60 },
      premium: { messages: -1, images: -1, voiceMinutes: -1 }
    };

    const planLimits = limits[user.subscription.plan];

    res.json({
      usage: user.usage,
      limits: planLimits,
      canUse: {
        messages: user.canUseFeature('messages'),
        images: user.canUseFeature('images'),
        voiceMinutes: user.canUseFeature('voiceMinutes')
      }
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const token = jwt.sign(
        { userId: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Redirect to frontend with token
      res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Google OAuth error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    }
  }
);

// Instagram OAuth routes
router.get('/instagram', passport.authenticate('instagram'));

router.get('/instagram/callback',
  passport.authenticate('instagram', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const token = jwt.sign(
        { userId: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Redirect to frontend with token
      res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Instagram OAuth error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    }
  }
);

// Phone number authentication
router.post('/phone/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Generate and store OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Check if user exists with this phone number
    let user = await User.findOne({ phone: phoneNumber });
    
    if (user) {
      // Update existing user's OTP
      user.authMethods.phone.otp = otp;
      user.authMethods.phone.otpExpires = otpExpires;
      await user.save();
    } else {
      // Create new user with phone number
      user = new User({
        phone: phoneNumber,
        name: `User_${phoneNumber.slice(-4)}`, // Temporary name
        authMethods: {
          phone: {
            otp,
            otpExpires
          }
        }
      });
      await user.save();
    }

    // Send OTP via SMS
    const smsResult = await smsService.sendOTP(phoneNumber);
    
    if (smsResult.success) {
      res.json({ 
        message: 'OTP sent successfully',
        // In development, you might want to return the OTP for testing
        ...(process.env.NODE_ENV === 'development' && { otp })
      });
    } else {
      res.status(500).json({ message: 'Failed to send OTP' });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/phone/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    // Find user by phone number
    const user = await User.findOne({ phone: phoneNumber });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP is valid and not expired
    if (!user.authMethods.phone.otp || 
        user.authMethods.phone.otp !== otp ||
        new Date() > user.authMethods.phone.otpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark phone as verified
    user.authMethods.phone.verified = true;
    user.authMethods.phone.otp = null;
    user.authMethods.phone.otpExpires = null;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Phone verified successfully',
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        subscription: user.subscription,
        usage: user.usage
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Link additional auth methods to existing user
router.post('/link/google', auth, async (req, res) => {
  try {
    const { googleId, email, name, picture } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if Google account is already linked to another user
    const existingGoogleUser = await User.findOne({ 'authMethods.google.id': googleId });
    if (existingGoogleUser && existingGoogleUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({ message: 'Google account already linked to another user' });
    }

    // Link Google account
    user.authMethods.google = {
      id: googleId,
      email,
      name,
      picture
    };
    
    if (!user.email) user.email = email;
    if (!user.profilePicture) user.profilePicture = picture;
    
    await user.save();

    res.json({ message: 'Google account linked successfully' });
  } catch (error) {
    console.error('Link Google error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/link/instagram', auth, async (req, res) => {
  try {
    const { instagramId, username, fullName, profilePicture } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if Instagram account is already linked to another user
    const existingInstagramUser = await User.findOne({ 'authMethods.instagram.id': instagramId });
    if (existingInstagramUser && existingInstagramUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({ message: 'Instagram account already linked to another user' });
    }

    // Link Instagram account
    user.authMethods.instagram = {
      id: instagramId,
      username,
      fullName,
      profilePicture
    };
    
    if (!user.profilePicture) user.profilePicture = profilePicture;
    
    await user.save();

    res.json({ message: 'Instagram account linked successfully' });
  } catch (error) {
    console.error('Link Instagram error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
