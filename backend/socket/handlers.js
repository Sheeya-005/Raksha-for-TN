import { dbStore } from '../models/dbStore.js';

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

export function setupSocketHandlers(io) {
  // Store connected socket maps
  const connectedUsers = new Map(); // userId -> socketId

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Register active user (Admin, Police, or Volunteer)
    socket.on('user:register', async (data) => {
      const { userId, role } = data;
      if (!userId) return;

      socket.join(`role:${role}`);
      socket.join(`user:${userId}`);
      connectedUsers.set(userId, socket.id);
      
      console.log(`[Socket] User registered: ${userId} (${role})`);

      // Update online status in db
      await dbStore.updateUser(userId, { availabilityStatus: role === 'admin' ? 'Offline' : 'Available' });
      io.emit('users:list_changed');
    });

    // Real-time location pings from responders (Police or Volunteer Panel)
    socket.on('responder:location:update', async (data) => {
      const { userId, lat, lng } = data;
      if (!userId || lat === undefined || lng === undefined) return;

      // Update location in db
      await dbStore.updateUser(userId, {
        lat: Number(lat),
        lng: Number(lng),
        lastLocationUpdate: new Date()
      });

      console.log(`[Socket] Live GPS Ping from Responder ${userId}: (${lat}, ${lng})`);

      // Broadcast update to Admin panel
      io.emit('responder:location:changed', { userId, lat, lng, timestamp: new Date() });
    });

    // Smartwatch registration (Simulator or Wearable connection)
    socket.on('smartwatch:register', (data) => {
      const { deviceId, userId } = data;
      if (!deviceId) return;

      socket.join(`device:${deviceId}`);
      console.log(`[Socket] Smartwatch registered: ${deviceId}`);
    });

    // GPS and heartbeat data from smartwatch simulator
    socket.on('smartwatch:data', (data) => {
      const { deviceId, lat, lng, battery, heartRate } = data;
      if (!deviceId || lat === undefined || lng === undefined) return;

      console.log(`[Socket] Smartwatch Ping ${deviceId}: Location(${lat}, ${lng}) Batt(${battery}%) HR(${heartRate})`);
      io.emit('smartwatch:location:changed', { deviceId, lat, lng, battery, heartRate, timestamp: new Date() });
    });

    // Smartwatch/Simulator SOS Alert Trigger
    socket.on('smartwatch:sos', async (data) => {
      const { victimName, victimPhone, lat, lng, victimId, message } = data;
      console.log(`[EMERGENCY] SOS received via Socket. Location: (${lat}, ${lng})`);

      try {
        const resolvedVictimName = victimName || 'Smartwatch Wearer';
        const resolvedVictimPhone = victimPhone || '+91 9998887776';
        const resolvedVictimId = victimId || `SW_${Math.floor(1000 + Math.random() * 9000)}`;

        // Retrieve available responders
        const allUsers = await dbStore.getUsers();
        const availablePolice = allUsers.filter(u => u.role === 'police' && u.availabilityStatus === 'Available');
        const availableVolunteers = allUsers.filter(u => u.role === 'volunteer' && u.availabilityStatus === 'Available');

        let selectedResponder = null;
        let selectedType = 'none';
        let minDistance = Infinity;

        // Prioritize police
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

        // Fallback to volunteer
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

        // Create alert
        const alertData = {
          victimId: resolvedVictimId,
          victimName: resolvedVictimName,
          victimPhone: resolvedVictimPhone,
          lat: Number(lat),
          lng: Number(lng),
          status: 'SOS Triggered',
          message: message || "I am in danger! (நான் ஆபத்தில் இருக்கிறேன்!)",
          assignedResponder: selectedResponder ? selectedResponder.id : null,
          responderType: selectedType,
          responderLat: selectedResponder ? selectedResponder.lat : null,
          responderLng: selectedResponder ? selectedResponder.lng : null
        };

        const newAlert = await dbStore.createAlert(alertData);

        if (selectedResponder) {
          // Twilio simulation log
          console.log(`\n📞 [TELEPHONY API - TWILIO] placing automated phone call to ${selectedResponder.name} (${selectedResponder.phone})`);
          console.log(`🔊 [CALL PLAYBACK]: "A woman is in an emergency. Her location has been sent to your mailbox. Please respond immediately."\n`);

          await dbStore.createLog(
            selectedResponder.id,
            'DISPATCH_ASSIGNED',
            `Alert ${newAlert.id} automatically assigned to nearest ${selectedType} responder ${selectedResponder.name} at distance ${minDistance.toFixed(2)} km.`
          );

          // Alert target responder via room
          io.to(`user:${selectedResponder.id}`).emit('alert:dispatch', {
            alert: newAlert,
            distance: minDistance,
            voiceCallPlayed: true
          });
        } else {
          await dbStore.createLog(
            'system',
            'DISPATCH_FAILED',
            `Alert ${newAlert.id} triggered but no active available responder was found in database.`
          );
        }

        // Broadcast to admins
        io.emit('alert:new', newAlert);
        io.emit('stats:update');
      } catch (err) {
        console.error('Error handling socket SOS event:', err);
      }
    });

    socket.on('disconnect', () => {
      // Find and remove disconnected user
      let disconnectedId = null;
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedId = userId;
          connectedUsers.delete(userId);
          break;
        }
      }

      if (disconnectedId) {
        console.log(`[Socket] Responder logged off / disconnected: ${disconnectedId}`);
        // Optionally set status to Offline, but let's keep it Available if they reload, 
        // in production we check heartbeat. Let's set status to Offline if they disconnect.
        dbStore.updateUser(disconnectedId, { availabilityStatus: 'Offline' }).then(() => {
          io.emit('users:list_changed');
        });
      }
    });
  });
}
