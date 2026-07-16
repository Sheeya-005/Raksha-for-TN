// Socket.IO event handlers for smartwatch real-time data

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Smartwatch registration
    socket.on('smartwatch:register', (data) => {
      const { deviceId, userId } = data;
      socket.join(`device:${deviceId}`);
      socket.join(`user:${userId}`);
      console.log(`[Socket] Smartwatch registered: ${deviceId} for user ${userId}`);
      io.emit('device:status', { deviceId, status: 'online', timestamp: new Date().toISOString() });
    });

    // GPS + sensor data from smartwatch
    socket.on('smartwatch:data', (data) => {
      const { deviceId, userId, lat, lng, heartRate, battery, timestamp } = data;
      console.log(`[Socket] Data from ${deviceId}: GPS(${lat},${lng}) HR:${heartRate} Batt:${battery}%`);
      // Broadcast to dashboard clients
      io.emit('location:update', { deviceId, userId, lat, lng, heartRate, battery, timestamp });
    });

    // SOS trigger
    socket.on('smartwatch:sos', (data) => {
      const { deviceId, userId, lat, lng, battery, heartRate } = data;
      console.log(`[EMERGENCY] SOS from device ${deviceId}, user ${userId}`);
      io.emit('alert:new', {
        id: `ALT_${Date.now()}`,
        deviceId, userId, lat, lng, battery, heartRate,
        alertType: 'SOS',
        severity: 'Critical',
        status: 'Active',
        timestamp: new Date().toISOString(),
      });
    });

    // Fall detection
    socket.on('smartwatch:fall', (data) => {
      const { deviceId, userId, lat, lng } = data;
      console.log(`[ALERT] Fall detected: device ${deviceId}`);
      io.emit('alert:new', {
        id: `ALT_${Date.now()}`,
        deviceId, userId, lat, lng,
        alertType: 'Fall Detection',
        severity: 'Critical',
        status: 'Active',
        timestamp: new Date().toISOString(),
      });
    });

    // Low battery
    socket.on('smartwatch:battery_low', (data) => {
      io.emit('alert:new', {
        ...data,
        alertType: 'Low Battery',
        severity: 'Medium',
        status: 'Active',
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      io.emit('device:status', { socketId: socket.id, status: 'offline', timestamp: new Date().toISOString() });
    });
  });

  // Simulate live smartwatch pings every 10 seconds (development only)
  if (process.env.NODE_ENV !== 'production') {
    setInterval(() => {
      io.emit('location:update', {
        deviceId: `SW${Math.floor(Math.random() * 9000) + 1000}`,
        userId: `USR${String(Math.floor(Math.random() * 28) + 1).padStart(4, '0')}`,
        lat: 8.5 + Math.random() * 5,
        lng: 76.8 + Math.random() * 3.5,
        heartRate: Math.floor(60 + Math.random() * 50),
        battery: Math.floor(20 + Math.random() * 80),
        timestamp: new Date().toISOString(),
      });
    }, 10000);
  }
}
