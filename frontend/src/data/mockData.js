import { TN_DISTRICTS } from './districts';

// Alert types
export const ALERT_TYPES = ['SOS', 'Fall Detection', 'Panic Button', 'Low Battery', 'Offline', 'Location Update'];
export const ALERT_STATUSES = ['Active', 'Resolved', 'Acknowledged'];
export const MARKER_TYPES = ['critical', 'assistance', 'safe', 'connected', 'offline'];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
function randomInt(min, max) {
  return Math.floor(randomBetween(min, max));
}
function randomFrom(arr) {
  return arr[randomInt(0, arr.length)];
}
function randomDate(daysAgo = 7) {
  const d = new Date();
  d.setMinutes(d.getMinutes() - randomInt(0, daysAgo * 24 * 60));
  return d.toISOString();
}

const NAMES = [
  'Arun Kumar','Priya Devi','Rajesh Selvan','Kavitha Nair','Murugan S',
  'Lakshmi B','Senthil Nathan','Anitha Ramesh','Vijay Mohan','Saranya T',
  'Deepak R','Meena S','Karthik P','Sudha M','Ganesh V','Revathi K',
  'Suresh C','Bhuvana J','Venkat L','Nithya A','Prasad G','Indra D',
  'Bharath N','Kamala S','Ravi T','Pooja M','Shankar B','Geetha C',
];

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const RELATIONSHIPS = ['Father','Mother','Spouse','Son','Daughter','Sibling','Friend'];

export const MOCK_USERS = Array.from({ length: 28 }, (_, i) => {
  const district = TN_DISTRICTS[randomInt(0, TN_DISTRICTS.length)];
  const markerType = randomFrom(MARKER_TYPES);
  return {
    id: `USR${String(i + 1).padStart(4, '0')}`,
    name: NAMES[i % NAMES.length],
    email: `user${i + 1}@safetytamil.in`,
    phone: `+91 ${randomInt(7000000000, 9999999999)}`,
    district: district.name,
    lat: district.lat + randomBetween(-0.3, 0.3),
    lng: district.lng + randomBetween(-0.3, 0.3),
    markerType,
    watchId: `SW${String(randomInt(1000, 9999))}`,
    battery: randomInt(10, 100),
    heartRate: randomInt(60, 120),
    signalStrength: randomInt(1, 5),
    bloodGroup: randomFrom(BLOOD_GROUPS),
    status: markerType === 'offline' ? 'Offline' : 'Online',
    lastUpdated: randomDate(1),
    address: `${randomInt(1, 500)}, ${district.name} Main Rd, Tamil Nadu`,
    firmwareVersion: `v${randomInt(1, 3)}.${randomInt(0, 9)}.${randomInt(0, 9)}`,
    medicalInfo: 'No known allergies',
  };
});

export const MOCK_ALERTS = Array.from({ length: 60 }, (_, i) => {
  const user = MOCK_USERS[randomInt(0, MOCK_USERS.length)];
  const alertType = randomFrom(ALERT_TYPES);
  const status = randomFrom(ALERT_STATUSES);
  return {
    id: `ALT${String(i + 1).padStart(5, '0')}`,
    userId: user.id,
    userName: user.name,
    watchId: user.watchId,
    phone: user.phone,
    district: user.district,
    lat: user.lat,
    lng: user.lng,
    address: user.address,
    alertType,
    description: `${alertType} triggered by ${user.name} in ${user.district}`,
    status,
    severity: alertType === 'SOS' || alertType === 'Fall Detection' ? 'Critical' :
              alertType === 'Panic Button' ? 'High' :
              alertType === 'Low Battery' ? 'Medium' : 'Low',
    timestamp: randomDate(7),
    battery: user.battery,
    heartRate: user.heartRate,
  };
});

export const MOCK_NOTIFICATIONS = MOCK_ALERTS.slice(0, 20).map((a, i) => ({
  id: `NOTIF${i + 1}`,
  alertId: a.id,
  userName: a.userName,
  alertType: a.alertType,
  district: a.district,
  lat: a.lat,
  lng: a.lng,
  status: a.status,
  severity: a.severity,
  timestamp: a.timestamp,
  read: i > 5,
}));

export const MOCK_CONTACTS = [
  { id: 'C1', name: 'Kavitha Arun', relationship: 'Spouse', phone: '+91 9876543210', email: 'kavitha@email.com', isPrimary: true },
  { id: 'C2', name: 'Suresh Kumar', relationship: 'Father', phone: '+91 9876543211', email: 'suresh@email.com', isPrimary: false },
  { id: 'C3', name: 'Priya Devi', relationship: 'Sibling', phone: '+91 9876543212', email: 'priya@email.com', isPrimary: false },
];

export const DASHBOARD_STATS = {
  totalUsers: MOCK_USERS.length,
  activeWatches: MOCK_USERS.filter(u => u.status === 'Online').length,
  activeAlerts: MOCK_ALERTS.filter(a => a.status === 'Active').length,
  resolvedAlerts: MOCK_ALERTS.filter(a => a.status === 'Resolved').length,
  offlineDevices: MOCK_USERS.filter(u => u.status === 'Offline').length,
  connectedDevices: MOCK_USERS.filter(u => u.status === 'Online').length,
  liveTracking: MOCK_USERS.filter(u => u.markerType === 'connected' || u.markerType === 'safe').length,
};

export const ALERT_TREND = [
  { day: 'Mon', sos: 3, fall: 2, panic: 1, battery: 4 },
  { day: 'Tue', sos: 5, fall: 1, panic: 3, battery: 2 },
  { day: 'Wed', sos: 2, fall: 4, panic: 2, battery: 6 },
  { day: 'Thu', sos: 7, fall: 3, panic: 1, battery: 3 },
  { day: 'Fri', sos: 4, fall: 2, panic: 5, battery: 5 },
  { day: 'Sat', sos: 6, fall: 5, panic: 2, battery: 4 },
  { day: 'Sun', sos: 3, fall: 1, panic: 4, battery: 7 },
];

export const DISTRICT_STATS = TN_DISTRICTS.map(d => ({
  ...d,
  alerts: MOCK_ALERTS.filter(a => a.district === d.name).length,
  activeAlerts: MOCK_ALERTS.filter(a => a.district === d.name && a.status === 'Active').length,
  resolvedAlerts: MOCK_ALERTS.filter(a => a.district === d.name && a.status === 'Resolved').length,
  connectedWatches: MOCK_USERS.filter(u => u.district === d.name && u.status === 'Online').length,
  lastUpdated: randomDate(0.1),
}));
