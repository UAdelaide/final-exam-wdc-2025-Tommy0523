const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'a-very-secret-key', // Use an environment variable for the secret
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');
const apiRoutes = require('./routes/api');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);
app.use('/api', apiRoutes);

// Export the app instead of listening here
module.exports = app;