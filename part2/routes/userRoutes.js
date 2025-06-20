const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all users (for admin/testing)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, email, role FROM Users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST a new user (simple signup)
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, [username, email, password, role]);

    res.status(201).json({ message: 'User registered', user_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
});

// POST /api/users/login - Handle user login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const [users] = await db.execute('SELECT * FROM Users WHERE username = ?', [username]);

    if (users.length === 0) {
      return res.status(401).json({ message: 'Incorrect username or password.' });
    }

    const user = users[0];

    const isPasswordValid = user.password_hash === password;

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Incorrect username or password.' });
    }

    // Store user info in session
    req.session.user = {
      id: user.user_id,
      username: user.username,
      role: user.role
    };

    res.status(200).json({ 
      message: 'Login successful!',
      user: {
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
});

// POST /api/users/logout - End the session
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.clearCookie('connect.sid'); // The default cookie name for express-session
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

// GET /api/users/me/dogs - Get dogs owned by the logged in user
router.get('/me/dogs', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'owner') {
    return res.status(401).json({ error: 'Not logged in or not an owner' });
  }

  try {
    const [dogs] = await db.execute(
      'SELECT dog_id, name FROM Dogs WHERE owner_id = ?',
      [req.session.user.id]
    );
    res.json(dogs);
  } catch (error) {
    console.error('Failed to fetch owner dogs:', error);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

module.exports = router;