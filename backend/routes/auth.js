import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbStore } from '../models/dbStore.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'safewatch_secret_2025';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await dbStore.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify role if provided
    if (role && user.role !== role) {
      return res.status(403).json({ message: `Access denied. Account is not registered as ${role}.` });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({ message: 'Account is suspended' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // Log the action
    await dbStore.createLog(user.id, 'USER_LOGIN', `User ${user.name} logged in successfully as ${user.role}.`);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        gender: user.gender,
        availabilityStatus: user.availabilityStatus,
        lat: user.lat,
        lng: user.lng
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// POST /api/auth/signup (Volunteer/Police signup)
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password, gender, address, role, policeIdCardNumber, batchNumber } = req.body;
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const resolvedRole = role === 'police' ? 'police' : 'volunteer';

    if (resolvedRole === 'police' && (!policeIdCardNumber || !batchNumber)) {
      return res.status(400).json({ message: 'Police ID Card Number and Batch Number are required for Police registration' });
    }

    // Check if user already exists
    const existing = await dbStore.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await dbStore.createUser({
      name,
      email,
      phone,
      password: hashedPassword,
      role: resolvedRole,
      gender,
      profilePhoto: null,
      availabilityStatus: 'Available',
      lat: 13.0827,
      lng: 80.2707,
      accountStatus: 'active',
      policeIdCardNumber: resolvedRole === 'police' ? policeIdCardNumber : null,
      batchNumber: resolvedRole === 'police' ? batchNumber : null
    });

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

    // Log the signup
    await dbStore.createLog(newUser.id, 'USER_SIGNUP', `${resolvedRole.toUpperCase()} ${newUser.name} registered.`);

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        gender: newUser.gender,
        availabilityStatus: newUser.availabilityStatus,
        lat: newUser.lat,
        lng: newUser.lng
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ message: 'Token required' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await dbStore.getUserById(payload.id);
    if (!user || user.accountStatus === 'suspended') {
      return res.status(401).json({ message: 'Invalid user session' });
    }
    const newToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: newToken });
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

export default router;
