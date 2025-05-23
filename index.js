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
import * as mongoService    from './mongodbService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3000;

// --- SECURITY & MIDDLEWARE ---
app.set('trust proxy', 1);
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:'],
      connectSrc: [
        "'self'",
        process.env.FRONTEND_URL,
        ...(process.env.ADDITIONAL_API_ORIGINS?.split(',') || [])
      ]
    }
  })
);
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
app.use(express.json({ limit: '40mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// --- SERVE STATIC FRONTEND CALLBACK ---
app.use(express.static(path.join(__dirname, 'public')));

// --- SESSION SETUP ---
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge:   24 * 60 * 60 * 1000
    }
  })
);

passport.serializeUser((user, done) => done(null, user.uid));

passport.deserializeUser((uid, done) => done(null, { uid }));

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/googleCallback`
    },
    (accessToken, refreshToken, profile, done) => {
      // Assicurati che uid venga passato correttamente
      return done(null, { uid: profile.id });
    }
  )
);

// Middleware per copiare uid in req.session.uid
app.use((req, res, next) => {
  if (req.isAuthenticated() && req.session.passport && req.session.passport.user) {
    req.session.uid = req.session.passport.user;
  }
  next();
});

app.use(passport.initialize());
app.use(passport.session());

// --- AUTH ROUTES ---

// 1. Registrazione
app.post('/api/register', firebaseService.registerUser);

// 2. Login con email/password
app.post('/api/login', async (req, res, next) => {
  try {
    const { uid, message } = await firebaseService.loginUserRaw(
      req.body.email,
      req.body.password
    );
    // Imposto la sessione
    req.session.uid = uid;
    req.session.save(err => {
      if (err) return next(err);
      return res.json({ uid, message });
    });
  } catch (err) {
    return res
      .status(err.statusCode || 400)
      .json({ error: err.message });
  }
});

// 3. Reset password & verifica email
app.post('/api/resetPassword',      firebaseService.resetPassword);
app.post('/api/resendVerification', firebaseService.resendVerification);

// Google OAuth endpoints
app.get(
  '/api/googleLogin',
  passport.authenticate('google', { scope: ['profile'] })
);
app.get(
  '/api/googleCallback',
  passport.authenticate('google', {
    failureRedirect: process.env.FRONTEND_URL,
    session: true
  }),
  (req, res) => res.redirect(process.env.FRONTEND_URL)
);

// 5. Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Logout fallito' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Disconnesso' });
  });
});

// --- CSRF & PROTECTED PROJECT ROUTES ---
app.use(csurf({ cookie: true }));
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Token CSRF non valido' });
  }
  next(err);
});
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
function ensureAuth(req, res, next) {
  if (!req.session.uid) {
    return res.status(401).json({ error: 'Non autenticato' });
  }
  next();
}
app.post('/api/saveProject',     ensureAuth, mongoService.saveProject);
app.get ('/api/loadProjects',    ensureAuth, mongoService.loadProjects);
app.put ('/api/updateProject',   ensureAuth, mongoService.updateProject);
app.delete('/api/deleteProject', ensureAuth, mongoService.deleteProject);

// --- HEALTH CHECK & START ---
app.get('/', (req, res) => res.send('Server attivo 🚀'));
app.listen(PORT, () => console.log(`🚀 Server su porta ${PORT}`));
