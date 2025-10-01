const express = require('express');
const auth = require('../middleware/auth');
const Profile = require('../models/Profile');

const router = express.Router();

// Create new profile
router.post('/', auth, async (req, res) => {
  try {
    const { targetPerson, conversationStyle } = req.body;

    const profile = new Profile({
      userId: req.userId,
      targetPerson,
      conversationStyle
    });

    await profile.save();

    res.status(201).json({
      message: 'Profile created successfully',
      profile
    });
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({ message: 'Failed to create profile' });
  }
});

// Get all profiles for user
router.get('/', auth, async (req, res) => {
  try {
    const profiles = await Profile.find({
      userId: req.userId,
      isActive: true
    }).sort({ updatedAt: -1 });

    res.json({ profiles });
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ message: 'Failed to get profiles' });
  }
});

// Get specific profile
router.get('/:id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      _id: req.params.id,
      userId: req.userId,
      isActive: true
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
});

// Update profile
router.put('/:id', auth, async (req, res) => {
  try {
    const { targetPerson, conversationStyle } = req.body;

    const profile = await Profile.findOne({
      _id: req.params.id,
      userId: req.userId,
      isActive: true
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (targetPerson) {
      profile.targetPerson = { ...profile.targetPerson, ...targetPerson };
    }

    if (conversationStyle) {
      profile.conversationStyle = { ...profile.conversationStyle, ...conversationStyle };
    }

    await profile.save();

    res.json({
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Delete profile
router.delete('/:id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      _id: req.params.id,
      userId: req.userId,
      isActive: true
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    profile.isActive = false;
    await profile.save();

    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ message: 'Failed to delete profile' });
  }
});

// Get conversation history for profile
router.get('/:id/history', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      _id: req.params.id,
      userId: req.userId,
      isActive: true
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({
      history: profile.conversationHistory.slice(-20) // Last 20 interactions
    });
  } catch (error) {
    console.error('Get profile history error:', error);
    res.status(500).json({ message: 'Failed to get profile history' });
  }
});

// Get profile statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      _id: req.params.id,
      userId: req.userId,
      isActive: true
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const stats = {
      totalInteractions: profile.conversationHistory.length,
      successfulInteractions: profile.conversationHistory.filter(h => h.success).length,
      textMessages: profile.conversationHistory.filter(h => h.type === 'text').length,
      images: profile.conversationHistory.filter(h => h.type === 'image').length,
      voiceMessages: profile.conversationHistory.filter(h => h.type === 'voice').length,
      screenshots: profile.conversationHistory.filter(h => h.type === 'screenshot').length,
      lastActivity: profile.updatedAt
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get profile stats error:', error);
    res.status(500).json({ message: 'Failed to get profile statistics' });
  }
});

module.exports = router;
