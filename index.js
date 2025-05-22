require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const helmet = require('helmet');
const csurf = require('csurf');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const firebaseService = require('./firebaseService');
const mongoService = require('./mongodbService');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
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
app.use(csurf({ cookie: true }));
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }
  next(err);
});
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

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

app.post('/api/saveProject', mongoService.saveProject);
app.get('/api/loadProjects', mongoService.loadProjects);
app.put('/api/updateProject', mongoService.updateProject);
app.delete('/api/deleteProject', mongoService.deleteProject);
app.post('/api/register', firebaseService.registerUser);
app.post('/api/login', firebaseService.loginUser);
app.post('/api/resetPassword', firebaseService.resetPassword);
app.post('/api/resendVerification', firebaseService.resendVerification);

const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Server attivo 🚀'));
app.listen(PORT, () => console.log(`✅ Server listening on port ${PORT}`));
