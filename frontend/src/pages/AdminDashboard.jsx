import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { 
  Shield, Users, Radio, AlertTriangle, CheckCircle, Clock, MapPin, 
  Phone, LogOut, BarChart3, List, Activity, Settings, Calendar, Filter
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { TN_DISTRICTS, TN_CENTER } from '../data/districts';
import { getStatusBadge, timeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';

// Custom icons matching color rules
function createMarkerIcon(color) {
  return L.divIcon({
    html: `<div style="
      width: 14px; height: 14px;
      background: ${color};
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 8px ${color};
    "></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7]
  });
}

const icons = {
  active: createMarkerIcon('#ef4444'),     // RED = Active Emergency
  attending: createMarkerIcon('#f97316'),  // ORANGE = Emergency Being Attended
  resolved: createMarkerIcon('#22c55e'),   // GREEN = Resolved Emergency
  police: createMarkerIcon('#3b82f6'),     // BLUE = Police Officer
  volunteer: createIconHtml('#22c55e')      // GREEN = Available Volunteer (matching rule: Available Volunteer = GREEN)
};

function createIconHtml(color) {
  return L.divIcon({
    html: `<div style="width: 12px; height: 12px; background: ${color}; border: 1.5px solid #fff; border-radius: 50%;"></div>`,
    className: '',
    iconSize: [12, 12]
  });
}

export default function AdminDashboard() {
  const { logout, user, updateProfile } = useAuth();
  const { socket, liveAlerts, setLiveAlerts, liveResponders } = useSocket();
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [viewMode, setViewMode] = useState('marker'); // marker, heatmap

  // Navigation tabs matching sidebar
  const [activeTab, setActiveTab] = useState('overview'); // overview, live-map, active-emergencies, district-analytics, responders-police, responders-volunteers, history, logs

  // Settings Form state
  const [newUsername, setNewUsername] = useState(user?.email || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingCredentials, setUpdatingCredentials] = useState(false);

  useEffect(() => {
    if (user) {
      setNewUsername(user.email);
    }
  }, [user]);

  const handleCredentialsChange = async (e) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!newUsername) {
      toast.error("Username cannot be empty");
      return;
    }

    setUpdatingCredentials(true);
    try {
      await axios.post(`${getApiUrl()}/users/change-credentials`, {
        userId: user.id,
        oldPassword,
        newUsername,
        newPassword: newPassword || undefined
      });
      toast.success("Security credentials updated successfully");
      updateProfile({ email: newUsername });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update credentials");
    } finally {
      setUpdatingCredentials(false);
    }
  };

  // Filters for alerts
  const [statusFilter, setStatusFilter] = useState('All');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [selectedDistrictDetail, setSelectedDistrictDetail] = useState(null);

  const getApiUrl = () => {
    const { protocol, hostname, port } = window.location;
    if (port === '5173') return `${protocol}//${hostname}:5000/api`;
    return `${protocol}//${hostname}${port ? ':' + port : ''}/api`;
  };

  const fetchSystemData = async () => {
    try {
      const resAlerts = await axios.get(`${getApiUrl()}/alerts`);
      setLiveAlerts(resAlerts.data);

      const resUsers = await axios.get(`${getApiUrl()}/users`);
      setUsers(resUsers.data.users);

      const resLogs = await axios.get(`${getApiUrl()}/users/logs`);
      setLogs(resLogs.data);
    } catch (err) {
      console.error('Error loading Admin Data:', err);
    }
  };

  useEffect(() => {
    fetchSystemData();

    if (socket) {
      socket.on('stats:update', fetchSystemData);
      socket.on('users:list_changed', fetchSystemData);
    }

    return () => {
      if (socket) {
        socket.off('stats:update');
        socket.off('users:list_changed');
      }
    };
  }, [socket]);

  // Helper functions
  const isAlertActive = (a) => a.status !== 'Resolved' && a.status !== 'RESOLVED' && a.status !== 'CLOSED';
  
  const getDistrictName = (a) => {
    if (a.district) return a.district;
    const distData = TN_DISTRICTS.find(d => Math.abs(d.lat - a.lat) < 0.25 && Math.abs(d.lng - a.lng) < 0.25);
    return distData ? distData.name : 'Chennai';
  };

  // Helper: Calculate distance using Haversine formula (returns distance in km)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
  };

  const getNearestResponder = (alertLat, alertLng) => {
    const availableResponders = users.filter(
      u => (u.role === 'police' || u.role === 'volunteer') && u.availabilityStatus === 'Available'
    );
    
    let nearest = null;
    let minDistance = Infinity;

    // Filter and prioritize police first
    const police = availableResponders.filter(u => u.role === 'police');
    if (police.length > 0) {
      police.forEach(r => {
        const dist = calculateDistance(alertLat, alertLng, r.lat, r.lng);
        if (dist < minDistance) {
          minDistance = dist;
          nearest = r;
        }
      });
    } else {
      // Fallback to volunteers
      const volunteers = availableResponders.filter(u => u.role === 'volunteer');
      volunteers.forEach(r => {
        const dist = calculateDistance(alertLat, alertLng, r.lat, r.lng);
        if (dist < minDistance) {
          minDistance = dist;
          nearest = r;
        }
      });
    }

    return nearest ? { ...nearest, distanceKm: minDistance } : null;
  };

  // Statistics calculation
  const totalAlerts = liveAlerts.length;
  const activeAlerts = liveAlerts.filter(isAlertActive).length;
  const resolvedAlerts = liveAlerts.filter(a => !isAlertActive(a)).length;

  const totalPolice = users.filter(u => u.role === 'police').length;
  const onlinePolice = users.filter(u => u.role === 'police' && u.availabilityStatus !== 'Offline').length;
  const availablePolice = users.filter(u => u.role === 'police' && u.availabilityStatus === 'Available').length;

  const totalVolunteers = users.filter(u => u.role === 'volunteer').length;
  const onlineVolunteers = users.filter(u => u.role === 'volunteer' && u.availabilityStatus !== 'Offline').length;
  const availableVolunteers = users.filter(u => u.role === 'volunteer' && u.availabilityStatus === 'Available').length;

  // Average response calculation
  const computeAverageResponse = () => {
    const acceptedCases = liveAlerts.filter(a => a.acceptedTime && a.triggerTime);
    if (acceptedCases.length === 0) return '3.2 Min';
    const sum = acceptedCases.reduce((acc, a) => {
      const diff = new Date(a.acceptedTime) - new Date(a.triggerTime);
      return acc + diff;
    }, 0);
    const avgMin = (sum / acceptedCases.length) / 60000;
    return `${avgMin.toFixed(1)} Min`;
  };

  const getDistrictHighestAlerts = () => {
    const counts = {};
    liveAlerts.forEach(a => {
      const d = getDistrictName(a);
      counts[d] = (counts[d] || 0) + 1;
    });
    let highestDist = 'Chennai';
    let highestVal = 0;
    Object.entries(counts).forEach(([d, c]) => {
      if (c > highestVal) {
        highestVal = c;
        highestDist = d;
      }
    });
    return `${highestDist} (${highestVal})`;
  };

  // Filter alerts
  const filteredAlerts = liveAlerts.filter(a => {
    const statusMatch = statusFilter === 'All' || a.status === statusFilter;
    const districtName = getDistrictName(a);
    const districtMatch = districtFilter === 'All' || districtName === districtFilter;
    return statusMatch && districtMatch;
  });

  // Recharts district comparison data
  const getDistrictChartData = () => {
    return TN_DISTRICTS.slice(0, 8).map(d => {
      const dAlerts = liveAlerts.filter(a => {
        if (a.district) return a.district === d.name;
        const match = Math.abs(a.lat - d.lat) < 0.25 && Math.abs(a.lng - d.lng) < 0.25;
        return match;
      });
      return {
        name: d.name,
        Active: dAlerts.filter(isAlertActive).length,
        Resolved: dAlerts.filter(a => !isAlertActive(a)).length,
        Total: dAlerts.length
      };
    });
  };

  // Recharts Monthly trend
  const trendData = [
    { name: 'Jan', alerts: 4 },
    { name: 'Feb', alerts: 8 },
    { name: 'Mar', alerts: 5 },
    { name: 'Apr', alerts: 12 },
    { name: 'May', alerts: 7 },
    { name: 'Jun', alerts: 15 },
    { name: 'Jul', alerts: liveAlerts.length }
  ];

  return (
    <div className="min-h-screen bg-[#070A13] text-slate-300 flex overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#0B0F19] border-r border-slate-900 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-slate-900 flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-lg text-white">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-extrabold text-xs tracking-wider uppercase text-white">SAFEWATCH TN</span>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest -mt-0.5">Control Center</p>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {[
              { id: 'overview', label: 'Command Overview', icon: Activity },
              { id: 'live-map', label: 'Tamil Nadu Live Map', icon: MapPin },
              { id: 'active-emergencies', label: 'Active Emergencies', icon: AlertTriangle },
              { id: 'district-analytics', label: 'District Analytics', icon: BarChart3 },
              { id: 'responders-police', label: 'Police Officers', icon: Shield },
              { id: 'responders-volunteers', label: 'Volunteers', icon: Users },
              { id: 'history', label: 'Emergency History', icon: Clock },
              { id: 'logs', label: 'System Logs', icon: List },
              { id: 'settings', label: 'Security Settings', icon: Settings }
            ].map(tabItem => {
              const TabIcon = tabItem.icon;
              return (
                <button
                  key={tabItem.id}
                  onClick={() => {
                    setActiveTab(tabItem.id);
                    setSelectedDistrictDetail(null);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    activeTab === tabItem.id 
                      ? 'bg-red-600/10 text-red-500 border-l-2 border-red-500 rounded-l-none' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`}
                >
                  <TabIcon className="w-4 h-4 shrink-0" />
                  <span>{tabItem.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-900">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-xs">A</div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-200 truncate">Administrator</div>
              <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">State HQ Command</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-2 border border-slate-800 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top bar status */}
        <header className="px-6 py-4 border-b border-slate-900 bg-[#0B0F19] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              {activeTab.replace('-', ' ')}
            </h2>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              SafeWatch Tamil Nadu HQ Command Deck
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold bg-green-500/5 border border-green-500/10 text-green-400 px-3 py-1.5 rounded-lg">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
            <span>LIVE HQ MONITORING</span>
          </div>
        </header>

        {/* Overview command deck */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6 animate-fade-in">
            
            {/* Top State Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {[
                { label: 'Total SOS Alerts', value: totalAlerts, color: 'text-white bg-slate-900 border-slate-800' },
                { label: 'Active Alerts', value: activeAlerts, color: 'text-red-500 bg-red-500/5 border-red-500/10' },
                { label: 'Resolved Alerts', value: resolvedAlerts, color: 'text-green-500 bg-green-500/5 border-green-500/10' },
                { label: 'Active Responders', value: onlinePolice + onlineVolunteers, color: 'text-blue-400 bg-blue-500/5 border-blue-500/10' },
                { label: 'Avg Response Time', value: computeAverageResponse(), color: 'text-purple-400 bg-purple-500/5 border-purple-500/10' },
                { label: 'Highest Alert District', value: getDistrictHighestAlerts(), color: 'text-amber-400 bg-amber-500/5 border-amber-500/10' }
              ].map((stat, i) => (
                <div key={i} className={`p-4 rounded-xl border ${stat.color}`}>
                  <div className="text-lg font-black">{stat.value}</div>
                  <div className="text-[9px] uppercase font-bold tracking-widest text-slate-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Split row: State map preview and District comparisons */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Map preview */}
              <div className="lg:col-span-2 flex flex-col space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">State-wide Emergency Map</h3>
                  
                  {/* Standard / Heat Map selector */}
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
                    <button 
                      onClick={() => setViewMode('marker')}
                      className={`px-2.5 py-1 rounded transition-all cursor-pointer ${viewMode === 'marker' ? 'bg-slate-850 text-white' : 'text-slate-500'}`}
                    >
                      Marker Map
                    </button>
                    <button 
                      onClick={() => setViewMode('heatmap')}
                      className={`px-2.5 py-1 rounded transition-all cursor-pointer ${viewMode === 'heatmap' ? 'bg-slate-850 text-white' : 'text-slate-500'}`}
                    >
                      Heat Map
                    </button>
                  </div>
                </div>

                <div className="h-[280px] rounded-xl border border-slate-900 overflow-hidden relative">
                  <MapContainer
                    center={[TN_CENTER.lat, TN_CENTER.lng]}
                    zoom={7}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                  >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    
                    {/* Render Markers */}
                    {viewMode === 'marker' ? (
                      liveAlerts.map(a => {
                        let markerIcon = icons.active;
                        if (a.status === 'Resolved' || a.status === 'RESOLVED') markerIcon = icons.resolved;
                        else if (a.status === 'CLOSED') markerIcon = icons.resolved; // or grey
                        else if (
                          a.status !== 'SOS Triggered' && a.status !== 'SOS_TRIGGERED' &&
                          a.status !== 'Alert Received' && a.status !== 'ALERT_RECEIVED'
                        ) {
                          // Attending icon (orange)
                          markerIcon = L.divIcon({
                            html: `<div style="width: 14px; height: 14px; background: #f97316; border: 2.5px solid #fff; border-radius: 50%; box-shadow: 0 0 8px #f97316;"></div>`,
                            className: '',
                            iconSize: [14, 14],
                            iconAnchor: [7, 7],
                            popupAnchor: [0, -7]
                          });
                        }
                        return (
                          <Marker key={a.id} position={[a.lat, a.lng]} icon={markerIcon}>
                            <Popup>
                              <div className="p-2.5 min-w-[200px] text-xs font-sans text-slate-350 bg-slate-950/90 rounded-lg space-y-1.5">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-1 mb-1.5">
                                  <span className="font-bold text-red-500 font-mono">{a.id}</span>
                                  <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-red-500/10 text-red-400">{a.status}</span>
                                </div>
                                <div className="space-y-1">
                                  <p><span className="text-slate-500 font-medium">Victim ID:</span> <span className="font-semibold text-white">{a.victimId || 'N/A'}</span></p>
                                  <p><span className="text-slate-500 font-medium">Victim Name:</span> <span className="font-semibold text-white">{a.victimName}</span></p>
                                  <p><span className="text-slate-500 font-medium">Latitude:</span> <span className="font-mono text-white">{a.lat.toFixed(5)}</span></p>
                                  <p><span className="text-slate-500 font-medium">Longitude:</span> <span className="font-mono text-white">{a.lng.toFixed(5)}</span></p>
                                  {a.accuracy !== null && a.accuracy !== undefined && (
                                    <p><span className="text-slate-500 font-medium">GPS Accuracy:</span> <span className="text-cyan-400 font-semibold">{a.accuracy}m</span></p>
                                  )}
                                  <p><span className="text-slate-500 font-medium">SOS Time:</span> <span className="text-white">{new Date(a.triggerTime || a.timestamp).toLocaleTimeString()} ({timeAgo(a.triggerTime)})</span></p>
                                  <p><span className="text-slate-500 font-medium">District:</span> <span className="text-orange-400 font-semibold">{getDistrictName(a)}</span></p>
                                  <p><span className="text-slate-500 font-medium">Message:</span> <span className="text-red-400 font-bold">{a.message || 'I am in danger!'}</span></p>
                                </div>

                                {isAlertActive(a) && (
                                  <div className="border-t border-slate-800 pt-1.5 mt-1.5 space-y-1 text-[10px]">
                                    <div className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Nearest Responder</div>
                                    {(() => {
                                      const nr = getNearestResponder(a.lat, a.lng);
                                      if (nr) {
                                        return (
                                          <div className="space-y-0.5 text-[10px] text-slate-350">
                                            <div>Name: <span className="font-semibold text-white capitalize">{nr.name} ({nr.role})</span></div>
                                            <div>Distance: <span className="text-cyan-400 font-bold">{nr.distanceKm.toFixed(2)} km</span></div>
                                            <div>Status: <span className="font-semibold text-white uppercase">{nr.availabilityStatus}</span></div>
                                          </div>
                                        );
                                      }
                                      return <div className="text-slate-500">No available responders found</div>;
                                    })()}
                                  </div>
                                )}
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })
                    ) : (
                      /* Render Heat Map Overlays */
                      liveAlerts.map(a => (
                        <Circle
                          key={a.id}
                          center={[a.lat, a.lng]}
                          radius={12000}
                          pathOptions={{
                            fillColor: '#ef4444',
                            fillOpacity: 0.25,
                            color: 'transparent'
                          }}
                        />
                      ))
                    )}
                  </MapContainer>
                </div>
              </div>

              {/* Quick district summary */}
              <div className="flex flex-col space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Alerts Feed</h3>
                <div className="flex-1 border border-slate-900 rounded-xl bg-[#0B0F19]/40 p-4 overflow-y-auto max-h-[280px] space-y-3 scrollbar-thin">
                  {liveAlerts.filter(isAlertActive).slice(0, 5).map(alert => (
                    <div key={alert.id} className="p-3 border border-slate-900 bg-slate-950/60 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-red-500">{alert.id}</span>
                        <span className="text-[9px] uppercase font-bold text-slate-400">{timeAgo(alert.triggerTime)}</span>
                      </div>
                      <div className="font-bold text-white">{alert.victimName}</div>
                      <div className="text-[10px] text-slate-500">Location Lat: {alert.lat.toFixed(4)}</div>
                      <div className="mt-1 font-semibold text-red-400 text-[10px]">{alert.message || 'I am in danger!'}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Recharts Analytics comparing District Active/Resolved cases */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="p-5 border border-slate-900 bg-[#0B0F19]/20 rounded-xl space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Emergency Concentration Comparison</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getDistrictChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                      <Bar dataKey="Active" fill="#ef4444" stackId="a" />
                      <Bar dataKey="Resolved" fill="#22c55e" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-5 border border-slate-900 bg-[#0B0F19]/20 rounded-xl space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">State-wide Emergency Trends</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                      <Line type="monotone" dataKey="alerts" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab: Tamil Nadu Live Map */}
        {activeTab === 'live-map' && (
          <div className="p-6 space-y-4 flex-1 flex flex-col min-h-0 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tamil Nadu Live Map Command</h3>
              
              <div className="flex items-center gap-3">
                {/* District Filter */}
                <select
                  value={districtFilter}
                  onChange={e => setDistrictFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0B0F19] text-xs font-bold"
                >
                  <option value="All">All Districts</option>
                  {TN_DISTRICTS.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
                
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0B0F19] text-xs font-bold"
                >
                  <option value="All">All Statuses</option>
                  <option value="SOS Triggered">SOS Triggered</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Responding">Responding</option>
                  <option value="Reached Location">Reached Location</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div className="flex-1 rounded-xl border border-slate-900 overflow-hidden min-h-[400px]">
              <MapContainer
                center={[TN_CENTER.lat, TN_CENTER.lng]}
                zoom={7}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                
                {/* Render Filtered Alerts */}
                {filteredAlerts.map(a => {
                  let markerIcon = icons.active;
                  if (a.status === 'Resolved' || a.status === 'RESOLVED') markerIcon = icons.resolved;
                  else if (a.status === 'CLOSED') markerIcon = icons.resolved;
                  else if (
                    a.status !== 'SOS Triggered' && a.status !== 'SOS_TRIGGERED' &&
                    a.status !== 'Alert Received' && a.status !== 'ALERT_RECEIVED'
                  ) {
                    markerIcon = L.divIcon({
                      html: `<div style="width: 14px; height: 14px; background: #f97316; border: 2.5px solid #fff; border-radius: 50%; box-shadow: 0 0 8px #f97316;"></div>`,
                      className: '',
                      iconSize: [14, 14],
                      iconAnchor: [7, 7],
                      popupAnchor: [0, -7]
                    });
                  }
                  return (
                    <Marker key={a.id} position={[a.lat, a.lng]} icon={markerIcon}>
                      <Popup>
                        <div className="p-2.5 min-w-[200px] text-xs font-sans text-slate-350 bg-slate-950/90 rounded-lg space-y-1.5">
                          <div className="flex justify-between items-center border-b border-slate-800 pb-1 mb-1.5">
                            <span className="font-bold text-red-500 font-mono">{a.id}</span>
                            <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-red-500/10 text-red-400">{a.status}</span>
                          </div>
                          <div className="space-y-1">
                            <p><span className="text-slate-500 font-medium">Victim ID:</span> <span className="font-semibold text-white">{a.victimId || 'N/A'}</span></p>
                            <p><span className="text-slate-500 font-medium">Victim Name:</span> <span className="font-semibold text-white">{a.victimName}</span></p>
                            <p><span className="text-slate-500 font-medium">Latitude:</span> <span className="font-mono text-white">{a.lat.toFixed(5)}</span></p>
                            <p><span className="text-slate-500 font-medium">Longitude:</span> <span className="font-mono text-white">{a.lng.toFixed(5)}</span></p>
                            {a.accuracy !== null && a.accuracy !== undefined && (
                              <p><span className="text-slate-500 font-medium">GPS Accuracy:</span> <span className="text-cyan-400 font-semibold">{a.accuracy}m</span></p>
                            )}
                            <p><span className="text-slate-500 font-medium">SOS Time:</span> <span className="text-white">{new Date(a.triggerTime || a.timestamp).toLocaleTimeString()} ({timeAgo(a.triggerTime)})</span></p>
                            <p><span className="text-slate-500 font-medium">District:</span> <span className="text-orange-400 font-semibold">{getDistrictName(a)}</span></p>
                            <p><span className="text-slate-500 font-medium">Message:</span> <span className="text-red-400 font-bold">{a.message || 'I am in danger!'}</span></p>
                          </div>

                          {isAlertActive(a) && (
                            <div className="border-t border-slate-800 pt-1.5 mt-1.5 space-y-1 text-[10px]">
                              <div className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Nearest Responder</div>
                              {(() => {
                                const nr = getNearestResponder(a.lat, a.lng);
                                if (nr) {
                                  return (
                                    <div className="space-y-0.5 text-[10px] text-slate-350">
                                      <div>Name: <span className="font-semibold text-white capitalize">{nr.name} ({nr.role})</span></div>
                                      <div>Distance: <span className="text-cyan-400 font-bold">{nr.distanceKm.toFixed(2)} km</span></div>
                                      <div>Status: <span className="font-semibold text-white uppercase">{nr.availabilityStatus}</span></div>
                                    </div>
                                  );
                                }
                                return <div className="text-slate-500">No available responders found</div>;
                              })()}
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>
        )}

        {/* Tab: Heat Map View */}
        {activeTab === 'logs' && (
          <div className="p-6 space-y-4 flex-1 flex flex-col min-h-0 animate-fade-in">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Activity logs</h3>
            
            <div className="flex-1 border border-slate-900 rounded-xl overflow-hidden bg-slate-950/20 max-h-[500px] overflow-y-auto p-4 space-y-2.5 font-mono text-[10px]">
              {logs.map(log => (
                <div key={log.id} className="border-b border-slate-900 pb-2">
                  <div className="flex justify-between items-center text-red-500 font-bold mb-0.5">
                    <span>{log.action}</span>
                    <span className="text-[9px] text-slate-500 font-normal">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-400 leading-normal">{log.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Active Emergencies */}
        {activeTab === 'active-emergencies' && (
          <div className="p-6 space-y-4 animate-fade-in">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Emergency Dispatch Registry</h3>
            <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950/20 text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    <th className="px-4 py-3">Alert ID</th>
                    <th className="px-4 py-3">Victim Name</th>
                    <th className="px-4 py-3">Victim Message</th>
                    <th className="px-4 py-3">Trigger Coordinates</th>
                    <th className="px-4 py-3">Trigger Time</th>
                    <th className="px-4 py-3">Assigned First Responder</th>
                    <th className="px-4 py-3">Case Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {liveAlerts.filter(isAlertActive).map(a => (
                    <tr key={a.id} className="border-b border-slate-900 text-slate-300">
                      <td className="px-4 py-3 font-mono text-red-500 font-bold">{a.id}</td>
                      <td className="px-4 py-3 font-bold">{a.victimName}</td>
                      <td className="px-4 py-3 font-semibold text-red-400">{a.message || 'I am in danger! (நான் ஆபத்தில் இருக்கிறேன்!)'}</td>
                      <td className="px-4 py-3 font-mono">{a.lat.toFixed(4)}, {a.lng.toFixed(4)}</td>
                      <td className="px-4 py-3">{new Date(a.triggerTime).toLocaleTimeString()}</td>
                      <td className="px-4 py-3 capitalize font-semibold">{a.assignedResponder ? `${a.responderType}: ${users.find(u => u.id === a.assignedResponder)?.name || a.assignedResponder}` : 'Unassigned'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${getStatusBadge(a.status)}`}>{a.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={async () => {
                            try {
                              await axios.patch(`${getApiUrl()}/alerts/${a.id}`, {
                                status: 'CLOSED',
                                description: 'Emergency resolved and closed by Admin command.'
                              });
                              fetchSystemData();
                              toast.success(`Emergency ${a.id} CLOSED.`);
                            } catch (err) {
                              console.error(err);
                              toast.error('Failed to close emergency');
                            }
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold rounded bg-red-600/10 border border-red-500/20 hover:bg-red-600/25 text-red-400 cursor-pointer transition-all"
                        >
                          Close Case
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: District Analytics */}
        {activeTab === 'district-analytics' && (
          <div className="p-6 space-y-6 animate-fade-in">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">District Analytics Metrics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Detailed district selector list */}
              <div className="border border-slate-900 rounded-xl bg-slate-950/20 max-h-[380px] overflow-y-auto scrollbar-thin text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      <th className="px-4 py-3">District</th>
                      <th className="px-4 py-3 text-center">Alerts</th>
                      <th className="px-4 py-3 text-center">Active</th>
                      <th className="px-4 py-3 text-center">Resolved</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TN_DISTRICTS.map(d => {
                      const dAlerts = liveAlerts.filter(a => {
                        if (a.district) return a.district === d.name;
                        const match = Math.abs(a.lat - d.lat) < 0.25 && Math.abs(a.lng - d.lng) < 0.25;
                        return match;
                      });
                      return (
                        <tr key={d.id} className="border-b border-slate-900 text-slate-300">
                          <td className="px-4 py-3 font-bold">{d.name}</td>
                          <td className="px-4 py-3 text-center font-bold">{dAlerts.length}</td>
                          <td className="px-4 py-3 text-center text-red-500 font-bold">{dAlerts.filter(isAlertActive).length}</td>
                          <td className="px-4 py-3 text-center text-green-500 font-bold">{dAlerts.filter(a => !isAlertActive(a)).length}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setSelectedDistrictDetail(d.name)}
                              className="px-2.5 py-1 text-[10px] font-bold rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 cursor-pointer text-white"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* District analytics detail dashboard */}
              {selectedDistrictDetail ? (
                <div className="p-5 border border-slate-900 bg-[#0B0F19]/30 rounded-xl space-y-4 text-xs">
                  <h4 className="font-extrabold text-sm text-red-500 uppercase tracking-widest">District Inspect: {selectedDistrictDetail}</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-500">Total Incidents</span>
                      <span className="text-sm font-bold text-white">
                        {liveAlerts.filter(a => {
                          if (a.district) return a.district === selectedDistrictDetail;
                          const dist = TN_DISTRICTS.find(d => d.name === selectedDistrictDetail);
                          return dist && Math.abs(a.lat - dist.lat) < 0.25 && Math.abs(a.lng - dist.lng) < 0.25;
                        }).length}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-500">Active Emergencies</span>
                      <span className="text-sm font-bold text-red-500">
                        {liveAlerts.filter(a => {
                          if (a.district) return a.district === selectedDistrictDetail && isAlertActive(a);
                          const dist = TN_DISTRICTS.find(d => d.name === selectedDistrictDetail);
                          return dist && isAlertActive(a) && Math.abs(a.lat - dist.lat) < 0.25 && Math.abs(a.lng - dist.lng) < 0.25;
                        }).length}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center border border-slate-900 border-dashed rounded-xl py-16 text-center text-slate-500 font-bold">
                  Click "Inspect" next to any district to inspect district level parameters.
                </div>
              )}

            </div>
          </div>
        )}

        {/* Tab: Police Officers */}
        {activeTab === 'responders-police' && (
          <div className="p-6 space-y-4 animate-fade-in">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Police First Responder Registry</h3>
            <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950/20 text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    <th className="px-4 py-3">User ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Availability</th>
                    <th className="px-4 py-3">Account Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.role === 'police').map(u => (
                    <tr key={u.id} className="border-b border-slate-900 text-slate-300">
                      <td className="px-4 py-3 font-mono font-bold text-slate-400">{u.id}</td>
                      <td className="px-4 py-3 font-bold text-white">{u.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{u.email}</td>
                      <td className="px-4 py-3 text-slate-300">{u.phone}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
                          u.availabilityStatus === 'Available' ? 'bg-green-500/10 text-green-400' : 'bg-slate-800 text-slate-400'
                        }`}>{u.availabilityStatus}</span>
                      </td>
                      <td className="px-4 py-3 capitalize font-semibold text-slate-300">{u.accountStatus || 'active'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={async () => {
                            const newStatus = u.accountStatus === 'suspended' ? 'active' : 'suspended';
                            try {
                              await axios.patch(`${getApiUrl()}/users/${u.id}/account-status`, { status: newStatus });
                              fetchSystemData();
                              toast.success(`User ${u.name} has been ${newStatus}.`);
                            } catch (err) {
                              toast.error('Failed to change user status.');
                            }
                          }}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded cursor-pointer transition-all ${
                            u.accountStatus === 'suspended'
                              ? 'bg-green-600/10 border border-green-500/20 text-green-400 hover:bg-green-600/20'
                              : 'bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20'
                          }`}
                        >
                          {u.accountStatus === 'suspended' ? 'Activate' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Volunteers */}
        {activeTab === 'responders-volunteers' && (
          <div className="p-6 space-y-4 animate-fade-in">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Community Volunteer Registry</h3>
            <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950/20 text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    <th className="px-4 py-3">User ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Availability</th>
                    <th className="px-4 py-3">Account Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.role === 'volunteer').map(u => (
                    <tr key={u.id} className="border-b border-slate-900 text-slate-300">
                      <td className="px-4 py-3 font-mono font-bold text-slate-400">{u.id}</td>
                      <td className="px-4 py-3 font-bold text-white">{u.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{u.email}</td>
                      <td className="px-4 py-3 text-slate-300">{u.phone}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
                          u.availabilityStatus === 'Available' ? 'bg-green-500/10 text-green-400' : 'bg-slate-800 text-slate-400'
                        }`}>{u.availabilityStatus}</span>
                      </td>
                      <td className="px-4 py-3 capitalize font-semibold text-slate-300">{u.accountStatus || 'active'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={async () => {
                            const newStatus = u.accountStatus === 'suspended' ? 'active' : 'suspended';
                            try {
                              await axios.patch(`${getApiUrl()}/users/${u.id}/account-status`, { status: newStatus });
                              fetchSystemData();
                              toast.success(`User ${u.name} has been ${newStatus}.`);
                            } catch (err) {
                              toast.error('Failed to change user status.');
                            }
                          }}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded cursor-pointer transition-all ${
                            u.accountStatus === 'suspended'
                              ? 'bg-green-600/10 border border-green-500/20 text-green-400 hover:bg-green-600/20'
                              : 'bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20'
                          }`}
                        >
                          {u.accountStatus === 'suspended' ? 'Activate' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Emergency History */}
        {activeTab === 'history' && (
          <div className="p-6 space-y-4 animate-fade-in">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Emergency Incident History Log</h3>
            <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950/20 text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    <th className="px-4 py-3">Alert ID</th>
                    <th className="px-4 py-3">Victim Name</th>
                    <th className="px-4 py-3">District</th>
                    <th className="px-4 py-3">Coordinates</th>
                    <th className="px-4 py-3">Trigger Time</th>
                    <th className="px-4 py-3">Assigned Responder</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {liveAlerts.filter(a => !isAlertActive(a)).map(a => (
                    <tr key={a.id} className="border-b border-slate-900 text-slate-350">
                      <td className="px-4 py-3 font-mono font-bold text-slate-400">{a.id}</td>
                      <td className="px-4 py-3 font-bold text-slate-350">{a.victimName}</td>
                      <td className="px-4 py-3 font-semibold text-slate-300">{a.district || 'Chennai'}</td>
                      <td className="px-4 py-3 font-mono">{a.lat.toFixed(4)}, {a.lng.toFixed(4)}</td>
                      <td className="px-4 py-3 text-slate-300">{new Date(a.triggerTime || a.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3 capitalize text-slate-300">{a.assignedResponder ? `${a.responderType}: ${users.find(u => u.id === a.assignedResponder)?.name || a.assignedResponder}` : 'None'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${getStatusBadge(a.status)}`}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Security Settings */}
        {activeTab === 'settings' && (
          <div className="p-6 space-y-6 max-w-md animate-fade-in">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Security Configuration</h3>
            
            <div className="p-6 border border-slate-900 bg-slate-950/40 rounded-xl space-y-5 text-xs">
              <div className="border-b border-slate-900 pb-3">
                <h4 className="font-extrabold text-white text-sm">Update Security Credentials</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Change state command portal username & password</p>
              </div>

              <form onSubmit={handleCredentialsChange} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block">Current Password (Required)</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    className="w-full bg-[#0E1322] border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block">New Admin Username</label>
                  <input
                    type="text"
                    required
                    placeholder="admin"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    className="w-full bg-[#0E1322] border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block">New Password (Optional)</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-[#0E1322] border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#0E1322] border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updatingCredentials}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg transition-all cursor-pointer text-center"
                >
                  {updatingCredentials ? 'Saving Credentials...' : 'Save Credentials'}
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
