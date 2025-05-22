require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const firebaseService = require('./firebaseService');
const mongoService = require('./mongodbService');

const app = express();

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [process.env.FRONTEND_URL, 'http://127.0.0.1:5500'];
    if (!origin || allowed.includes(origin)) callback(null, true);
    else callback(new Error('CORS policy: Origin not allowed'), false);
  },
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '40mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));
app.use(cookieParser());

// Passport setup
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/api/googleCallback`
}, (accessToken, refreshToken, profile, done) => {
  return done(null, { uid: profile.id, displayName: profile.displayName });
}));
app.use(passport.initialize());
app.use(passport.session());

// Public auth routes (no CSRF)
app.post('/api/register', firebaseService.registerUser);
app.post('/api/login', firebaseService.loginUser);
app.post('/api/resetPassword', firebaseService.resetPassword);
app.post('/api/resendVerification', firebaseService.resendVerification);
app.get('/api/googleLogin', passport.authenticate('google', { scope: ['profile'] }));
app.get('/api/googleCallback', passport.authenticate('google', {
  failureRedirect: process.env.FRONTEND_URL,
  session: true
}), (req, res) => {
  res.redirect(process.env.FRONTEND_URL);
});

// CSRF protection for other routes
const csurf = require('csurf');
app.use(csurf({ cookie: true }));
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') return res.status(403).json({ message: 'Invalid CSRF token' });
  next(err);
});
app.get('/api/csrf-token', (req, res) => res.json({ csrfToken: req.csrfToken() }));

// Protected project routes
app.post('/api/saveProject', mongoService.saveProject);
app.get('/api/loadProjects', mongoService.loadProjects);
app.put('/api/updateProject', mongoService.updateProject);
app.delete('/api/deleteProject', mongoService.deleteProject);

app.get('/', (req, res) => res.send('Server attivo 🚀'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server listening on port ${PORT}`));
