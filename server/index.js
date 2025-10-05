const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();

// Import passport configuration
require('./config/passport');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const subscriptionRoutes = require('./routes/subscription');
const profileRoutes = require('./routes/profile');
const uploadRoutes = require('./routes/upload');

const app = express();
const server = createServer(app);

// CRITICAL FIX: Define the Client URL once for all CORS policies.
// This is the final version to ensure no accidental fallback to "localhost" breaks the production app.
const clientOrigin = process.env.CLIENT_URL || 
                     (process.env.NODE_ENV === 'production' 
                        ? process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.rizzmate.com' 
                        : "http://localhost:3000");

// 1. Configure CORS Options (to be reused by Express and Socket.io)
const corsOptions = {
    origin: clientOrigin,
    credentials: true, // IMPORTANT: Needed for session/JWT cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

const io = new Server(server, {
  cors: {
    origin: clientOrigin, // Use the unified origin variable
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());

// 2. Apply CORS to Express App
app.use(cors(corsOptions)); // Apply the robust options here

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration for OAuth
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  // In a secure production environment like Render, you MUST set secure: true
  cookie: { secure: process.env.NODE_ENV === 'production' } 
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rizzmate', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.io for real-time chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });
  
  socket.on('send-message', (data) => {
    socket.to(data.roomId).emit('receive-message', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };
