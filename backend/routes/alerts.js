import express from 'express';
import { dbStore } from '../models/dbStore.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'safewatch_secret_2025';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Authentication token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Helper: Calculate distance using Haversine formula (returns distance in km)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Radius of the Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET /api/alerts - List all alerts
router.get('/', async (req, res) => {
  try {
    const alerts = await dbStore.getAlerts();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: 'Server error retrieving alerts' });
  }
});

// GET /api/alerts/:id - Get specific alert details
router.get('/:id', async (req, res) => {
  try {
    const alert = await dbStore.getAlertById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: 'Server error retrieving alert' });
  }
});

// POST /api/alerts - SOS Button Pressed (Smartwatch API endpoint)
router.post('/', async (req, res) => {
  const io = req.app.get('io');
  try {
    const { victimName, victimPhone, lat, lng, victimId } = req.body;
    
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'Coordinates are required to trigger SOS' });
    }

    const resolvedVictimName = victimName || 'Smartwatch Wearer';
    const resolvedVictimPhone = victimPhone || '+91 9998887776';
    const resolvedVictimId = victimId || `SW_${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Get all available users and compute all within 15 km radius
    const allUsers = await dbStore.getUsers();
    
    // Filter available police officers
    const availablePolice = allUsers.filter(
      u => u.role === 'police' && u.availabilityStatus === 'Available'
    );

    // Filter available volunteers
    const availableVolunteers = allUsers.filter(
      u => u.role === 'volunteer' && u.availabilityStatus === 'Available'
    );

    const nearbyResponders = allUsers.filter(u => {
      if (u.role !== 'police' && u.role !== 'volunteer') return false;
      if (u.availabilityStatus !== 'Available') return false;
      const dist = calculateDistance(lat, lng, u.lat, u.lng);
      return dist <= 15; // Within 15 km radius
    });

    let selectedResponder = null;
    let selectedType = 'none';
    let minDistance = Infinity;

    // Haversine match: Prioritize police first
    if (availablePolice.length > 0) {
      availablePolice.forEach(officer => {
        const dist = calculateDistance(lat, lng, officer.lat, officer.lng);
        if (dist < minDistance) {
          minDistance = dist;
          selectedResponder = officer;
          selectedType = 'police';
        }
      });
    }

    // If no police is available, search volunteers
    if (!selectedResponder && availableVolunteers.length > 0) {
      availableVolunteers.forEach(volunteer => {
        const dist = calculateDistance(lat, lng, volunteer.lat, volunteer.lng);
        if (dist < minDistance) {
          minDistance = dist;
          selectedResponder = volunteer;
          selectedType = 'volunteer';
        }
      });
    }

    // Create Emergency record
    const alertData = {
      victimId: resolvedVictimId,
      victimName: resolvedVictimName,
      victimPhone: resolvedVictimPhone,
      lat: Number(lat),
      lng: Number(lng),
      status: 'SOS Triggered',
      assignedResponder: selectedResponder ? selectedResponder.id : null,
      responderType: selectedType,
      responderLat: selectedResponder ? selectedResponder.lat : null,
      responderLng: selectedResponder ? selectedResponder.lng : null
    };

    const newAlert = await dbStore.createAlert(alertData);

    // Build set of responder IDs to notify (both the single closest and all within 15 km)
    const notifyUserIds = new Set();
    if (selectedResponder) notifyUserIds.add(selectedResponder.id);
    nearbyResponders.forEach(r => notifyUserIds.add(r.id));

    // Automatically trigger telephony alert / dispatch workflow
    if (selectedResponder) {
      // Simulate Telephony Call
      console.log(`\n📞 [TELEPHONY API - TWILIO] placing automated phone call to ${selectedResponder.name} (${selectedResponder.phone})`);
      console.log(`🔊 [CALL PLAYBACK]: "A woman is in an emergency. Her location has been sent to your mailbox. Please respond immediately."\n`);

      // Create system log
      await dbStore.createLog(
        selectedResponder.id,
        'DISPATCH_ASSIGNED',
        `Alert ${newAlert.id} automatically assigned to ${selectedType} responder ${selectedResponder.name} at a distance of ${minDistance.toFixed(2)} km.`
      );
    } else {
      // Create system log without assignment
      await dbStore.createLog(
        'system',
        'DISPATCH_FAILED',
        `Alert ${newAlert.id} triggered but no active available responder was found in database.`
      );
    }

    // Alert all targeted responders via socket.io
    if (io && notifyUserIds.size > 0) {
      for (const responderId of notifyUserIds) {
        const responder = allUsers.find(u => u.id === responderId);
        if (responder) {
          const dist = calculateDistance(lat, lng, responder.lat, responder.lng);
          io.to(`user:${responder.id}`).emit('alert:dispatch', {
            alert: newAlert,
            distance: dist,
            voiceCallPlayed: true
          });
          console.log(`[Socket] Alert dispatched to responder: ${responder.name} (${responder.role}) at distance ${dist.toFixed(2)} km.`);
        }
      }
    }

    // Broadcast new alert to admin socket
    if (io) {
      io.emit('alert:new', newAlert);
      io.emit('stats:update'); // Ask admin dashboard to refresh statistics
    }

    res.status(201).json({
      success: true,
      alert: newAlert,
      responder: selectedResponder ? {
        id: selectedResponder.id,
        name: selectedResponder.name,
        phone: selectedResponder.phone,
        role: selectedResponder.role,
        distanceKm: minDistance
      } : null
    });
  } catch (err) {
    console.error('Trigger SOS API error:', err);
    res.status(500).json({ message: 'Server error triggering SOS' });
  }
});

// PATCH /api/alerts/:id - Update alert status & timeline
router.patch('/:id', authenticateToken, async (req, res) => {
  const io = req.app.get('io');
  try {
    const { status, description } = req.body;
    const validStatuses = [
      'Alert Received', 'Accepted', 'Responding', 'Reached Location', 'Resolved',
      'SOS_TRIGGERED', 'ALERT_RECEIVED', 'RESPONDER_ASSIGNED', 'ACCEPTED', 'RESPONDING', 'REACHED_LOCATION', 'RESOLVED', 'CLOSED'
    ];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid or missing alert status' });
    }

    const alert = await dbStore.getAlertById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    const updates = {
      status,
      timelineEvent: {
        status,
        timestamp: new Date(),
        description: description || `Status updated to ${status}`
      }
    };

    if (status === 'Accepted' || status === 'ACCEPTED') {
      updates.acceptedTime = new Date();
      updates.assignedResponder = req.user.id;
      updates.responderType = req.user.role;
      const responder = await dbStore.getUserById(req.user.id);
      if (responder) {
        updates.responderLat = responder.lat;
        updates.responderLng = responder.lng;
      }
      await dbStore.updateUser(req.user.id, { availabilityStatus: 'Responding' });
    } else if (status === 'Reached Location' || status === 'REACHED_LOCATION') {
      updates.arrivalTime = new Date();
    } else if (status === 'Resolved' || status === 'RESOLVED' || status === 'CLOSED') {
      updates.resolutionTime = new Date();
      // Free up the responder
      const responderId = alert.assignedResponder || req.user.id;
      if (responderId) {
        await dbStore.updateUser(responderId, { availabilityStatus: 'Available' });
      }
    }

    const updatedAlert = await dbStore.updateAlert(req.params.id, updates);

    // Broadcast update via Socket.IO
    if (io) {
      io.emit('alert:update', updatedAlert);
      io.emit(`alert:status:${req.params.id}`, updatedAlert);
      io.emit('stats:update');
    }

    // Log the change
    await dbStore.createLog(
      alert.assignedResponder || 'system',
      'ALERT_STATUS_UPDATE',
      `Alert ${alert.id} status updated to: ${status}.`
    );

    res.json(updatedAlert);
  } catch (err) {
    console.error('Update alert error:', err);
    res.status(500).json({ message: 'Server error updating alert' });
  }
});

export default router;
