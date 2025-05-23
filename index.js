// index.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import helmet from 'helmet';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import csurf from 'csurf';
import path from 'path';
import { fileURLToPath } from 'url';

import * as firebaseService from './firebaseService.js';
import * as mongoService from './mongodbService.js';

// Setup for __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security setup
app.set('trust proxy', 1);
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", process.env.FRONTEND_URL, ...(process.env.ADDITIONAL_API_ORIGINS?.split(',') || [])]
    }
  })
);

// Enable CORS with credentials and custom origins
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      'https://muse-brush.vercel.app',
      'http://127.0.0.1:5500',
      ...(process.env.ADDITIONAL_API_ORIGINS?.split(',') || [])
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'X-CSRF-Token']
  })
);

// Middleware setup
app.use(express.json({ limit: '40mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

// Passport initialization for authentication
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport session serialization
passport.serializeUser((user, done) => done(null, user.uid));
passport.deserializeUser((uid, done) => done(null, { uid }));

// Google OAuth 2.0 strategy setup
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/googleCallback`
    },
    (accessToken, refreshToken, profile, done) => {
      done(null, { uid: profile.id });
    }
  )
);

// Middleware to attach user ID to session
app.use((req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.session.passport && req.session.passport.user) {
    req.session.uid = req.session.passport.user;
  }
  next();
});

// Firebase-based auth API endpoints
app.post('/api/register', firebaseService.registerUser);

// Email/password login with session handling
app.post('/api/login', async (req, res, next) => {
  try {
    const { uid, message } = await firebaseService.loginUserRaw(req.body.email, req.body.password);
    req.session.uid = uid;
    req.session.save(err => {
      if (err) return next(err);
      return res.json({ uid, message });
    });
  } catch (err) {
    return res.status(err.statusCode || 400).json({ error: err.message });
  }
});

// Other auth routes
app.post('/api/resetPassword', firebaseService.resetPassword);
app.post('/api/resendVerification', firebaseService.resendVerification);

// Google login entry point
app.get('/api/googleLogin', passport.authenticate('google', { scope: ['profile'] }));

// Google OAuth callback
app.get(
  '/api/googleCallback',
  passport.authenticate('google', { failureRedirect: process.env.FRONTEND_URL, session: true }),
  (req, res) => res.redirect(process.env.FRONTEND_URL)
);

// Logout route to destroy session
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Logout fallito' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Disconnesso' });
  });
});

// CSRF protection middleware
app.use(csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// CSRF error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Token CSRF non valido' });
  }
  next(err);
});

// Route to get CSRF token for frontend use
app.get('/api/csrf-token', (req, res) => res.json({ csrfToken: req.csrfToken() }));

// Middleware to ensure the user is authenticated
function ensureAuth(req, res, next) {
  if (!req.session.uid) {
    return res.status(401).json({ error: 'Non autenticato' });
  }
  next();
}

// Project data API routes (protected)
app.post('/api/saveProject', ensureAuth, mongoService.saveProject);
app.get('/api/loadProjects', ensureAuth, mongoService.loadProjects);
app.put('/api/updateProject', ensureAuth, mongoService.updateProject);
app.delete('/api/deleteProject', ensureAuth, mongoService.deleteProject);

// Default health check route
app.get('/', (req, res) => res.send('Server attivo 🚀'));

// Start the server
app.listen(PORT, () => console.log(`🚀 Server su porta ${PORT}`));
