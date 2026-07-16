import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'safewatch_secret_2025';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    // In production: look up user in MongoDB, verify bcrypt hash
    const token = jwt.sign({ email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { email, role: 'user' } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing required fields' });
    const hash = await bcrypt.hash(password, 12);
    // In production: save to MongoDB
    const token = jwt.sign({ email, role: role || 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { name, email, phone, role: role || 'user' } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  const { token } = req.body;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const newToken = jwt.sign({ email: payload.email, role: payload.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: newToken });
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;
