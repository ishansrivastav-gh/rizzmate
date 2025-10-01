const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const InstagramStrategy = require('passport-instagram').Strategy;
const User = require('../models/User');

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with Google ID
    let user = await User.findOne({ 'authMethods.google.id': profile.id });
    
    if (user) {
      return done(null, user);
    }

    // Check if user exists with same email
    user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      // Link Google account to existing user
      user.authMethods.google = {
        id: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        picture: profile.photos[0].value
      };
      user.profilePicture = profile.photos[0].value;
      await user.save();
      return done(null, user);
    }

    // Create new user
    user = new User({
      email: profile.emails[0].value,
      name: profile.displayName,
      profilePicture: profile.photos[0].value,
      authMethods: {
        google: {
          id: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          picture: profile.photos[0].value
        }
      }
    });

    await user.save();
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Instagram OAuth Strategy
passport.use(new InstagramStrategy({
  clientID: process.env.INSTAGRAM_CLIENT_ID,
  clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
  callbackURL: "/api/auth/instagram/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with Instagram ID
    let user = await User.findOne({ 'authMethods.instagram.id': profile.id });
    
    if (user) {
      return done(null, user);
    }

    // Check if user exists with same username as email
    user = await User.findOne({ email: `${profile.username}@instagram.com` });
    
    if (user) {
      // Link Instagram account to existing user
      user.authMethods.instagram = {
        id: profile.id,
        username: profile.username,
        fullName: profile.displayName,
        profilePicture: profile._json.data.profile_picture
      };
      if (!user.profilePicture) {
        user.profilePicture = profile._json.data.profile_picture;
      }
      await user.save();
      return done(null, user);
    }

    // Create new user
    user = new User({
      email: `${profile.username}@instagram.com`,
      name: profile.displayName || profile.username,
      profilePicture: profile._json.data.profile_picture,
      authMethods: {
        instagram: {
          id: profile.id,
          username: profile.username,
          fullName: profile.displayName,
          profilePicture: profile._json.data.profile_picture
        }
      }
    });

    await user.save();
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
