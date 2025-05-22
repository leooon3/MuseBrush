require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const helmet = require('helmet');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const firebaseService = require('./firebaseService');
const mongoService = require('./mongodbService');
const csurf = require('csurf');

const app = express();

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:"],
    connectSrc: ["'self'", process.env.FRONTEND_URL, 'http://127.0.0.1:5500'],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"]
  }
}));

app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://127.0.0.1:5500'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'X-CSRF-Token']
}));

app.use(express.json({ limit: '40mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24
  }
}));

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

app.post('/api/register', firebaseService.registerUser);
app.post('/api/login', async (req, res) => {
  try {
    const { uid, message } = await firebaseService.loginUserRaw(req.body.email, req.body.password);
    req.session.uid = uid;
    res.json({ uid, message });
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});
app.post('/api/resetPassword', firebaseService.resetPassword);
app.post('/api/resendVerification', firebaseService.resendVerification);
app.get('/api/googleLogin', passport.authenticate('google', { scope: ['profile'] }));
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send('Logout failed');
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});
app.get('/api/googleCallback',
  passport.authenticate('google', { failureRedirect: process.env.FRONTEND_URL, session: true }),
  (req, res) => res.redirect(process.env.FRONTEND_URL)
);

app.use(csurf({ cookie: true }));
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') return res.status(403).json({ message: 'Invalid CSRF token' });
  next(err);
});
app.get('/api/csrf-token', (req, res) => res.json({ csrfToken: req.csrfToken() }));

function ensureAuth(req, res, next) {
  if (!req.session.uid) return res.status(401).json({ error: 'Non autenticato' });
  next();
}

app.post('/api/saveProject', ensureAuth, mongoService.saveProject);
app.get('/api/loadProjects', ensureAuth, mongoService.loadProjects);
app.put('/api/updateProject', ensureAuth, mongoService.updateProject);
app.delete('/api/deleteProject', ensureAuth, mongoService.deleteProject);

app.get('/', (req, res) => res.send('Server attivo 🚀'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

