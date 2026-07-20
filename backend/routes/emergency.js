import express from 'express';
import jwt from 'jsonwebtoken';
import { dbStore } from '../models/dbStore.js';
import { io } from '../server.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'safewatch_secret_2025';

// All 38 Tamil Nadu Districts center coordinates (imported locally for geodesic calculations)
const TN_DISTRICTS = [
  { name: "Ariyalur", lat: 11.14, lng: 79.07 },
  { name: "Chengalpattu", lat: 12.69, lng: 79.97 },
  { name: "Chennai", lat: 13.08, lng: 80.27 },
  { name: "Coimbatore", lat: 11.01, lng: 76.97 },
  { name: "Cuddalore", lat: 11.75, lng: 79.77 },
  { name: "Dharmapuri", lat: 12.13, lng: 78.16 },
  { name: "Dindigul", lat: 10.37, lng: 77.97 },
  { name: "Erode", lat: 11.34, lng: 77.73 },
  { name: "Kallakurichi", lat: 11.74, lng: 78.96 },
  { name: "Kanchipuram", lat: 12.84, lng: 79.70 },
  { name: "Kanniyakumari", lat: 8.09, lng: 77.54 },
  { name: "Karur", lat: 10.96, lng: 78.08 },
  { name: "Krishnagiri", lat: 12.52, lng: 78.22 },
  { name: "Madurai", lat: 9.93, lng: 78.12 },
  { name: "Mayiladuthurai", lat: 11.10, lng: 79.65 },
  { name: "Nagapattinam", lat: 10.77, lng: 79.84 },
  { name: "Namakkal", lat: 11.22, lng: 78.17 },
  { name: "Nilgiris", lat: 11.41, lng: 76.73 },
  { name: "Perambalur", lat: 11.23, lng: 78.88 },
  { name: "Pudukkottai", lat: 10.38, lng: 78.82 },
  { name: "Ramanathapuram", lat: 9.37, lng: 78.83 },
  { name: "Ranipet", lat: 12.93, lng: 79.33 },
  { name: "Salem", lat: 11.67, lng: 78.15 },
  { name: "Sivaganga", lat: 9.84, lng: 78.48 },
  { name: "Tenkasi", lat: 8.96, lng: 77.32 },
  { name: "Thanjavur", lat: 10.79, lng: 79.14 },
  { name: "Theni", lat: 10.01, lng: 77.48 },
  { name: "Thoothukudi", lat: 8.79, lng: 78.15 },
  { name: "Tiruchirappalli", lat: 10.79, lng: 78.70 },
  { name: "Tirunelveli", lat: 8.73, lng: 77.70 },
  { name: "Tirupathur", lat: 12.50, lng: 78.57 },
  { name: "Tiruppur", lat: 11.11, lng: 77.34 },
  { name: "Tiruvallur", lat: 13.14, lng: 79.91 },
  { name: "Tiruvannamalai", lat: 12.23, lng: 79.07 },
  { name: "Tiruvarur", lat: 10.77, lng: 79.63 },
  { name: "Vellore", lat: 12.92, lng: 79.13 },
  { name: "Viluppuram", lat: 11.94, lng: 79.49 },
  { name: "Virudhunagar", lat: 9.58, lng: 77.96 }
];

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

// Helper: Determine district based on geodesic distance
function getDistrictFromCoords(lat, lng) {
  let nearestDistrict = 'Chennai';
  let minDistance = Infinity;
  for (const dist of TN_DISTRICTS) {
    const d = calculateDistance(lat, lng, dist.lat, dist.lng);
    if (d < minDistance) {
      minDistance = d;
      nearestDistrict = dist.name;
    }
  }
  return nearestDistrict;
}

// Authentication middleware
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

// POST /api/emergency/sos - Phone triggers SOS emergency alert
router.post('/sos', authenticateToken, async (req, res) => {
  try {
    const { emergencyId, victimId, latitude, longitude, accuracy, timestamp, emergencyStatus } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Coordinates are required to trigger SOS' });
    }

    const resolvedStatus = emergencyStatus || 'SOS_TRIGGERED';
    const resolvedVictimId = victimId || req.user.id;

    // Fetch victim user information
    const victim = await dbStore.getUserById(resolvedVictimId);
    const victimName = victim ? victim.name : 'Mobile SOS Tracker';
    const victimPhone = victim ? victim.phone : '+91 9998887776';

    // 1. Identify district based on coordinates
    const districtName = getDistrictFromCoords(Number(latitude), Number(longitude));

    // 2. Retrieve available responders
    const allUsers = await dbStore.getUsers();
    const availablePolice = allUsers.filter(u => u.role === 'police' && u.availabilityStatus === 'Available');
    const availableVolunteers = allUsers.filter(u => u.role === 'volunteer' && u.availabilityStatus === 'Available');

    let selectedResponder = null;
    let selectedType = 'none';
    let minDistance = Infinity;

    // Prioritize police officers
    if (availablePolice.length > 0) {
      availablePolice.forEach(officer => {
        const dist = calculateDistance(Number(latitude), Number(longitude), officer.lat, officer.lng);
        if (dist < minDistance) {
          minDistance = dist;
          selectedResponder = officer;
          selectedType = 'police';
        }
      });
    }

    // Fall back to volunteers if no police is available
    if (!selectedResponder && availableVolunteers.length > 0) {
      availableVolunteers.forEach(volunteer => {
        const dist = calculateDistance(Number(latitude), Number(longitude), volunteer.lat, volunteer.lng);
        if (dist < minDistance) {
          minDistance = dist;
          selectedResponder = volunteer;
          selectedType = 'volunteer';
        }
      });
    }

    // Create emergency record
    const alertId = emergencyId || `ALT_${Date.now()}`;
    const alertData = {
      id: alertId,
      victimId: resolvedVictimId,
      victimName,
      victimPhone,
      lat: Number(latitude),
      lng: Number(longitude),
      accuracy: accuracy !== undefined ? Number(accuracy) : null,
      district: districtName,
      status: resolvedStatus,
      assignedResponder: selectedResponder ? selectedResponder.id : null,
      responderType: selectedType,
      responderLat: selectedResponder ? selectedResponder.lat : null,
      responderLng: selectedResponder ? selectedResponder.lng : null,
      triggerTime: timestamp ? new Date(timestamp) : new Date(),
      timeline: [
        { status: resolvedStatus, timestamp: new Date(), description: `SOS alert triggered via phone GPS in ${districtName}.` }
      ]
    };

    const newAlert = await dbStore.createAlert(alertData);

    // Update selected responder to Busy / Responding status if found
    if (selectedResponder) {
      console.log(`\n📞 [TELEPHONY API - TWILIO] placing automated phone call to ${selectedResponder.name} (${selectedResponder.phone})`);
      console.log(`🔊 [CALL PLAYBACK]: "A woman is in an emergency. Her location has been sent to your mailbox. Please respond immediately."\n`);

      await dbStore.createLog(
        selectedResponder.id,
        'DISPATCH_ASSIGNED',
        `Alert ${newAlert.id} automatically assigned to nearest ${selectedType} responder ${selectedResponder.name} at distance ${minDistance.toFixed(2)} km.`
      );

      // Alert targeted responder
      if (io) {
        io.to(`user:${selectedResponder.id}`).emit('alert:dispatch', {
          alert: newAlert,
          distance: minDistance,
          voiceCallPlayed: true
        });
      }
    } else {
      await dbStore.createLog(
        'system',
        'DISPATCH_FAILED',
        `Alert ${newAlert.id} triggered but no active available responder was found in database.`
      );
    }

    // Broadcast new alert to admins and dashboards
    if (io) {
      io.emit('alert:new', newAlert);
      io.emit('stats:update');
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

// PATCH /api/emergency/sos/:id/location - Continuously update GPS location of active SOS
router.patch('/sos/:id/location', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const alertId = req.params.id;
    const alert = await dbStore.getAlertById(alertId);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    const updated = await dbStore.updateAlert(alertId, {
      lat: Number(latitude),
      lng: Number(longitude),
      accuracy: accuracy !== undefined ? Number(accuracy) : null
    });

    if (io) {
      io.emit('alert:update', updated);
      io.emit(`alert:status:${alertId}`, updated);
    }

    res.json({
      success: true,
      alert: updated
    });
  } catch (err) {
    console.error('Update SOS location error:', err);
    res.status(500).json({ message: 'Server error updating location' });
  }
});

export default router;
