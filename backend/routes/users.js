import express from 'express';
import { dbStore } from '../models/dbStore.js';

const router = express.Router();

// GET /api/users - List all users (Admins only)
router.get('/', async (req, res) => {
  try {
    const users = await dbStore.getUsers();
    // Exclude passwords from return data
    const sanitized = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      gender: u.gender,
      availabilityStatus: u.availabilityStatus,
      lat: u.lat,
      lng: u.lng,
      lastLocationUpdate: u.lastLocationUpdate,
      accountStatus: u.accountStatus
    }));
    res.json({ users: sanitized, total: sanitized.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error retrieving users' });
  }
});

// GET /api/users/logs - List all system activity logs (Admins only)
router.get('/logs', async (req, res) => {
  try {
    const logs = await dbStore.getLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error retrieving logs' });
  }
});

// GET /api/users/:id - Get user profile details
router.get('/:id', async (req, res) => {
  try {
    const user = await dbStore.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      gender: user.gender,
      availabilityStatus: user.availabilityStatus,
      lat: user.lat,
      lng: user.lng,
      lastLocationUpdate: user.lastLocationUpdate,
      accountStatus: user.accountStatus
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
});

// PATCH /api/users/:id/location - Update user live GPS coordinates
router.patch('/:id/location', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'Latitude and Longitude are required' });
    }

    const updated = await dbStore.updateUser(req.params.id, {
      lat: Number(lat),
      lng: Number(lng),
      lastLocationUpdate: new Date()
    });

    if (!updated) return res.status(404).json({ message: 'User not found' });

    res.json({
      id: updated.id,
      lat: updated.lat,
      lng: updated.lng,
      lastLocationUpdate: updated.lastLocationUpdate
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating location' });
  }
});

// PATCH /api/users/:id/status - Toggle availability status (police & volunteers)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Available', 'On Duty', 'Responding', 'Busy', 'Offline'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid or missing availability status' });
    }

    const updated = await dbStore.updateUser(req.params.id, { availabilityStatus: status });
    if (!updated) return res.status(404).json({ message: 'User not found' });

    // Log this status change
    await dbStore.createLog(updated.id, 'STATUS_CHANGE', `${updated.role.toUpperCase()} ${updated.name} updated availability to: ${status}`);

    res.json({
      id: updated.id,
      availabilityStatus: updated.availabilityStatus
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating status' });
  }
});

export default router;
