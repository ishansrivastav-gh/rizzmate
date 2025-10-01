const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const aiService = require('../services/aiService');
const Profile = require('../models/Profile');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and audio files are allowed'), false);
    }
  }
});

// Send text message
router.post('/text', auth, async (req, res) => {
  try {
    const { message, profileId } = req.body;
    
    if (!message || !profileId) {
      return res.status(400).json({ message: 'Message and profile ID are required' });
    }

    // Check usage limits
    if (!req.user.canUseFeature('messages')) {
      return res.status(403).json({ 
        message: 'Message limit reached. Upgrade your plan to continue.',
        limitReached: true
      });
    }

    // Get profile
    const profile = await Profile.findOne({ 
      _id: profileId, 
      userId: req.userId, 
      isActive: true 
    });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Get conversation history
    let conversation = await Conversation.findOne({ 
      userId: req.userId, 
      profileId,
      status: 'active'
    });

    if (!conversation) {
      conversation = new Conversation({
        userId: req.userId,
        profileId
      });
    }

    // Prepare conversation history for AI
    const conversationHistory = conversation.messages
      .slice(-10)
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

    // Process with AI
    const aiResponse = await aiService.processTextInput(message, profile, conversationHistory);

    // Add messages to conversation
    conversation.messages.push({
      type: 'user',
      content: message,
      inputType: 'text'
    });

    conversation.messages.push({
      type: 'ai',
      content: aiResponse.response,
      inputType: 'text'
    });

    await conversation.save();

    // Update user usage
    req.user.usage.messagesThisMonth += 1;
    await req.user.save();

    // Add to profile history
    profile.conversationHistory.push({
      type: 'text',
      content: message,
      response: aiResponse.response,
      success: true
    });
    await profile.save();

    res.json({
      response: aiResponse.response,
      conversationId: conversation._id,
      usage: req.user.usage
    });
  } catch (error) {
    console.error('Text chat error:', error);
    res.status(500).json({ message: 'Failed to process text message' });
  }
});

// Send image message
router.post('/image', auth, upload.single('image'), async (req, res) => {
  try {
    const { profileId } = req.body;
    
    if (!req.file || !profileId) {
      return res.status(400).json({ message: 'Image file and profile ID are required' });
    }

    // Check usage limits
    if (!req.user.canUseFeature('images')) {
      return res.status(403).json({ 
        message: 'Image limit reached. Upgrade your plan to continue.',
        limitReached: true
      });
    }

    // Get profile
    const profile = await Profile.findOne({ 
      _id: profileId, 
      userId: req.userId, 
      isActive: true 
    });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Get conversation history
    let conversation = await Conversation.findOne({ 
      userId: req.userId, 
      profileId,
      status: 'active'
    });

    if (!conversation) {
      conversation = new Conversation({
        userId: req.userId,
        profileId
      });
    }

    // Prepare conversation history
    const conversationHistory = conversation.messages
      .slice(-10)
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

    // Process with AI
    const aiResponse = await aiService.processImageInput(req.file.buffer, profile, conversationHistory);

    // Add messages to conversation
    conversation.messages.push({
      type: 'user',
      content: 'Image uploaded',
      inputType: 'image',
      metadata: {
        analysis: aiResponse.analysis
      }
    });

    conversation.messages.push({
      type: 'ai',
      content: aiResponse.response,
      inputType: 'text'
    });

    await conversation.save();

    // Update user usage
    req.user.usage.imagesThisMonth += 1;
    await req.user.save();

    // Add to profile history
    profile.conversationHistory.push({
      type: 'image',
      content: 'Image uploaded',
      response: aiResponse.response,
      success: true
    });
    await profile.save();

    res.json({
      response: aiResponse.response,
      analysis: aiResponse.analysis,
      conversationId: conversation._id,
      usage: req.user.usage
    });
  } catch (error) {
    console.error('Image chat error:', error);
    res.status(500).json({ message: 'Failed to process image' });
  }
});

// Send voice message
router.post('/voice', auth, upload.single('audio'), async (req, res) => {
  try {
    const { profileId } = req.body;
    
    if (!req.file || !profileId) {
      return res.status(400).json({ message: 'Audio file and profile ID are required' });
    }

    // Check usage limits
    if (!req.user.canUseFeature('voiceMinutes')) {
      return res.status(403).json({ 
        message: 'Voice limit reached. Upgrade your plan to continue.',
        limitReached: true
      });
    }

    // Get profile
    const profile = await Profile.findOne({ 
      _id: profileId, 
      userId: req.userId, 
      isActive: true 
    });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Get conversation history
    let conversation = await Conversation.findOne({ 
      userId: req.userId, 
      profileId,
      status: 'active'
    });

    if (!conversation) {
      conversation = new Conversation({
        userId: req.userId,
        profileId
      });
    }

    // Prepare conversation history
    const conversationHistory = conversation.messages
      .slice(-10)
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

    // Process with AI
    const aiResponse = await aiService.processVoiceInput(req.file.buffer, profile, conversationHistory);

    // Add messages to conversation
    conversation.messages.push({
      type: 'user',
      content: aiResponse.transcription,
      inputType: 'voice',
      metadata: {
        transcription: aiResponse.transcription
      }
    });

    conversation.messages.push({
      type: 'ai',
      content: aiResponse.response,
      inputType: 'text'
    });

    await conversation.save();

    // Update user usage (estimate 1 minute per voice message)
    req.user.usage.voiceMinutesThisMonth += 1;
    await req.user.save();

    // Add to profile history
    profile.conversationHistory.push({
      type: 'voice',
      content: aiResponse.transcription,
      response: aiResponse.response,
      success: true
    });
    await profile.save();

    res.json({
      response: aiResponse.response,
      transcription: aiResponse.transcription,
      conversationId: conversation._id,
      usage: req.user.usage
    });
  } catch (error) {
    console.error('Voice chat error:', error);
    res.status(500).json({ message: 'Failed to process voice message' });
  }
});

// Send screenshot message
router.post('/screenshot', auth, upload.single('screenshot'), async (req, res) => {
  try {
    const { profileId } = req.body;
    
    if (!req.file || !profileId) {
      return res.status(400).json({ message: 'Screenshot file and profile ID are required' });
    }

    // Check usage limits
    if (!req.user.canUseFeature('images')) {
      return res.status(403).json({ 
        message: 'Image limit reached. Upgrade your plan to continue.',
        limitReached: true
      });
    }

    // Get profile
    const profile = await Profile.findOne({ 
      _id: profileId, 
      userId: req.userId, 
      isActive: true 
    });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Get conversation history
    let conversation = await Conversation.findOne({ 
      userId: req.userId, 
      profileId,
      status: 'active'
    });

    if (!conversation) {
      conversation = new Conversation({
        userId: req.userId,
        profileId
      });
    }

    // Prepare conversation history
    const conversationHistory = conversation.messages
      .slice(-10)
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

    // Process with AI
    const aiResponse = await aiService.processScreenshotInput(req.file.buffer, profile, conversationHistory);

    // Add messages to conversation
    conversation.messages.push({
      type: 'user',
      content: 'Screenshot uploaded',
      inputType: 'screenshot',
      metadata: {
        analysis: aiResponse.analysis
      }
    });

    conversation.messages.push({
      type: 'ai',
      content: aiResponse.response,
      inputType: 'text'
    });

    await conversation.save();

    // Update user usage
    req.user.usage.imagesThisMonth += 1;
    await req.user.save();

    // Add to profile history
    profile.conversationHistory.push({
      type: 'screenshot',
      content: 'Screenshot uploaded',
      response: aiResponse.response,
      success: true
    });
    await profile.save();

    res.json({
      response: aiResponse.response,
      analysis: aiResponse.analysis,
      conversationId: conversation._id,
      usage: req.user.usage
    });
  } catch (error) {
    console.error('Screenshot chat error:', error);
    res.status(500).json({ message: 'Failed to process screenshot' });
  }
});

// Get conversation history
router.get('/conversation/:profileId', auth, async (req, res) => {
  try {
    const { profileId } = req.params;
    
    const conversation = await Conversation.findOne({
      userId: req.userId,
      profileId,
      status: 'active'
    });

    if (!conversation) {
      return res.json({ messages: [] });
    }

    res.json({
      messages: conversation.messages,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Failed to get conversation' });
  }
});

// Generate conversation starters
router.get('/starters/:profileId', auth, async (req, res) => {
  try {
    const { profileId } = req.params;
    
    const profile = await Profile.findOne({
      _id: profileId,
      userId: req.userId,
      isActive: true
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const starters = await aiService.generateConversationStarters(profile);
    
    res.json({ starters });
  } catch (error) {
    console.error('Generate starters error:', error);
    res.status(500).json({ message: 'Failed to generate conversation starters' });
  }
});

module.exports = router;
