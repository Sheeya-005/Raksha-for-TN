import bcrypt from 'bcryptjs';
import User from './User.js';
import Alert from './Alert.js';
import Log from './Log.js';

// Pre-generated password hashes for demo logins
const adminHash = bcrypt.hashSync('admin123', 10);
const policeHash = bcrypt.hashSync('police123', 10);
const volunteerHash = bcrypt.hashSync('volunteer123', 10);

// Default mock data for in-memory / initial insertion
const defaultUsers = [
  {
    id: 'USR_0001',
    name: 'Rajeswari Sundar',
    email: 'admin@safetytamil.in',
    phone: '+91 9876543210',
    password: adminHash,
    role: 'admin',
    gender: 'Female',
    availabilityStatus: 'Offline',
    lat: 13.0827,
    lng: 80.2707,
    lastLocationUpdate: new Date(),
    accountStatus: 'active'
  },
  {
    id: 'USR_0002',
    name: 'Inspector Vijay K.',
    email: 'police@safetytamil.in',
    phone: '+91 8876543211',
    password: policeHash,
    role: 'police',
    gender: 'Male',
    availabilityStatus: 'Available',
    lat: 13.0835,
    lng: 80.2710,
    lastLocationUpdate: new Date(),
    accountStatus: 'active'
  },
  {
    id: 'USR_0003',
    name: 'Senthil Kumar (Volunteer)',
    email: 'volunteer@safetytamil.in',
    phone: '+91 7776543212',
    password: volunteerHash,
    role: 'volunteer',
    gender: 'Male',
    availabilityStatus: 'Available',
    lat: 13.0850,
    lng: 80.2750,
    lastLocationUpdate: new Date(),
    accountStatus: 'active'
  },
  {
    id: 'USR_0004',
    name: 'Kavitha Nair (Volunteer)',
    email: 'kavitha@safetytamil.in',
    phone: '+91 6676543213',
    password: volunteerHash,
    role: 'volunteer',
    gender: 'Female',
    availabilityStatus: 'Available',
    lat: 13.0810,
    lng: 80.2690,
    lastLocationUpdate: new Date(),
    accountStatus: 'active'
  }
];

// Initial mock alerts to populate dashboards
const defaultAlerts = [
  {
    id: 'ALT_0001',
    victimId: 'smartwatch_123',
    victimName: 'Priya Dharshini',
    victimPhone: '+91 9994567890',
    lat: 13.0720,
    lng: 80.2520,
    status: 'Resolved',
    assignedResponder: 'USR_0002',
    responderType: 'police',
    responderLat: 13.0835,
    responderLng: 80.2710,
    triggerTime: new Date(Date.now() - 3600000 * 2), // 2 hours ago
    acceptedTime: new Date(Date.now() - 3600000 * 2 + 120000), // 2 min response
    arrivalTime: new Date(Date.now() - 3600000 * 2 + 600000), // 10 min arrival
    resolutionTime: new Date(Date.now() - 3600000 * 2 + 1800000), // 30 min resolve
    timeline: [
      { status: 'SOS Triggered', timestamp: new Date(Date.now() - 3600000 * 2), description: 'SOS Button Pressed' },
      { status: 'Alert Received', timestamp: new Date(Date.now() - 3600000 * 2 + 30000), description: 'Alert received by backend' },
      { status: 'Accepted', timestamp: new Date(Date.now() - 3600000 * 2 + 120000), description: 'Assigned to Inspector Vijay K.' },
      { status: 'Responding', timestamp: new Date(Date.now() - 3600000 * 2 + 180000), description: 'Responder is en route' },
      { status: 'Reached Location', timestamp: new Date(Date.now() - 3600000 * 2 + 600000), description: 'Responder reached victim location' },
      { status: 'Resolved', timestamp: new Date(Date.now() - 3600000 * 2 + 1800000), description: 'Incident resolved safely' }
    ]
  }
];

const defaultLogs = [
  {
    id: 'LOG_0001',
    userId: 'USR_0001',
    action: 'SYSTEM_START',
    description: 'SafeWatch TN system initialized.',
    timestamp: new Date(),
    ipAddress: '127.0.0.1'
  }
];

// In-Memory Database variables
let inMemoryUsers = [...defaultUsers];
let inMemoryAlerts = [...defaultAlerts];
let inMemoryLogs = [...defaultLogs];

// Checks if database is connected
let dbConnectedFlag = false;

export function setDbConnected(status) {
  dbConnectedFlag = status;
}

function isDbConnected() {
  return dbConnectedFlag;
}

// Automatically seed database if connected and empty
export async function seedDatabase() {
  if (!isDbConnected()) return;
  try {
    const userCount = await User.count();
    if (userCount === 0) {
      await User.bulkCreate(defaultUsers);
      console.log('🌱 Database seeded with default Users');
    }
    const alertCount = await Alert.count();
    if (alertCount === 0) {
      await Alert.bulkCreate(defaultAlerts);
      console.log('🌱 Database seeded with default Alerts');
    }
    const logCount = await Log.count();
    if (logCount === 0) {
      await Log.bulkCreate(defaultLogs);
      console.log('🌱 Database seeded with default Logs');
    }
  } catch (error) {
    console.error('Failed to seed database:', error);
  }
}

export const dbStore = {
  // USER METHODS
  getUsers: async () => {
    if (isDbConnected()) {
      const users = await User.findAll();
      return users.map(u => u.get({ plain: true }));
    }
    return inMemoryUsers;
  },

  getUserById: async (id) => {
    if (isDbConnected()) {
      const user = await User.findOne({ where: { id } });
      return user ? user.get({ plain: true }) : null;
    }
    return inMemoryUsers.find(u => u.id === id) || null;
  },

  getUserByEmail: async (email) => {
    if (isDbConnected()) {
      const user = await User.findOne({ where: { email: email.toLowerCase() } });
      return user ? user.get({ plain: true }) : null;
    }
    return inMemoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  createUser: async (userData) => {
    const id = `USR_${Date.now()}`;
    const newUser = { ...userData, id, lastLocationUpdate: new Date() };
    if (isDbConnected()) {
      const dbUser = await User.create(newUser);
      return dbUser.get({ plain: true });
    }
    inMemoryUsers.push(newUser);
    return newUser;
  },

  updateUser: async (id, updates) => {
    if (isDbConnected()) {
      const user = await User.findOne({ where: { id } });
      if (user) {
        await user.update(updates);
        return user.get({ plain: true });
      }
      return null;
    }
    const idx = inMemoryUsers.findIndex(u => u.id === id);
    if (idx !== -1) {
      inMemoryUsers[idx] = { ...inMemoryUsers[idx], ...updates, lastLocationUpdate: new Date() };
      return inMemoryUsers[idx];
    }
    return null;
  },

  // ALERT METHODS
  getAlerts: async () => {
    if (isDbConnected()) {
      const alerts = await Alert.findAll({ order: [['triggerTime', 'DESC']] });
      return alerts.map(a => a.get({ plain: true }));
    }
    return [...inMemoryAlerts].sort((a, b) => new Date(b.triggerTime) - new Date(a.triggerTime));
  },

  getAlertById: async (id) => {
    if (isDbConnected()) {
      const alert = await Alert.findOne({ where: { id } });
      return alert ? alert.get({ plain: true }) : null;
    }
    return inMemoryAlerts.find(a => a.id === id) || null;
  },

  createAlert: async (alertData) => {
    const id = `ALT_${Date.now()}`;
    const newAlert = {
      ...alertData,
      id,
      triggerTime: new Date(),
      timeline: [
        { status: 'SOS Triggered', timestamp: new Date(), description: 'SOS emergency activated' }
      ]
    };
    if (isDbConnected()) {
      const dbAlert = await Alert.create(newAlert);
      return dbAlert.get({ plain: true });
    }
    inMemoryAlerts.push(newAlert);
    return newAlert;
  },

  updateAlert: async (id, updates) => {
    if (isDbConnected()) {
      const alert = await Alert.findOne({ where: { id } });
      if (!alert) return null;

      let updatedTimeline = alert.timeline ? [...alert.timeline] : [];
      if (updates.timelineEvent) {
        updatedTimeline.push(updates.timelineEvent);
        delete updates.timelineEvent;
      }

      const fieldsToUpdate = { ...updates };
      if (updatedTimeline.length > 0) {
        fieldsToUpdate.timeline = updatedTimeline;
      }

      await alert.update(fieldsToUpdate);
      return alert.get({ plain: true });
    }
    const idx = inMemoryAlerts.findIndex(a => a.id === id);
    if (idx !== -1) {
      const current = inMemoryAlerts[idx];
      let newTimeline = [...current.timeline];
      if (updates.timelineEvent) {
        newTimeline.push(updates.timelineEvent);
      }
      const updated = {
        ...current,
        ...updates,
        timeline: newTimeline
      };
      delete updated.timelineEvent;
      inMemoryAlerts[idx] = updated;
      return updated;
    }
    return null;
  },

  // LOG METHODS
  getLogs: async () => {
    if (isDbConnected()) {
      const logs = await Log.findAll({ order: [['timestamp', 'DESC']] });
      return logs.map(l => l.get({ plain: true }));
    }
    return [...inMemoryLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  createLog: async (userId, action, description, ipAddress = '127.0.0.1') => {
    const id = `LOG_${Date.now()}`;
    const newLog = { id, userId, action, description, timestamp: new Date(), ipAddress };
    if (isDbConnected()) {
      const dbLog = await Log.create(newLog);
      return dbLog.get({ plain: true });
    }
    inMemoryLogs.push(newLog);
    return newLog;
  }
};
