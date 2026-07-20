import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { 
  Shield, Radio, Activity, Navigation, CheckCircle, Clock, MapPin, 
  Phone, LogOut, BarChart3, List, User, Bell, Volume2, Calendar, Filter
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { getStatusBadge, timeAgo } from '../utils/helpers';
import { TN_DISTRICTS } from '../data/districts';
import toast from 'react-hot-toast';

// Custom markers matching rule definitions
function createMarkerIcon(color) {
  return L.divIcon({
    html: `<div style="
      width: 14px; height: 14px;
      background: ${color};
      border: 2.5px solid #fff;
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
  activeAlert: createMarkerIcon('#ef4444'),   // RED = Active Emergency
  police: createMarkerIcon('#3b82f6'),        // BLUE = Police Officer
  volunteer: createMarkerIcon('#22c55e'),     // GREEN = Available Volunteer (GREEN available responder)
  attending: createMarkerIcon('#f97316'),     // ORANGE = Responder Currently Attending
};

// Map click coordinate simulator fallback
function LocationSimulatorEvents({ onSimulate }) {
  useMapEvents({
    click(e) {
      onSimulate(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// Distance helper: calculates in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
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

export default function PoliceDashboard() {
  const { user, token, logout, updateLocation, updateStatus } = useAuth();
  const { socket, assignedAlert, clearAssignedAlert, emitLocation, liveAlerts, setLiveAlerts } = useSocket();

  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, nearby-alerts, live-map, history, profile
  
  const getInitialCoordinates = () => {
    if (user?.selectedDistrict) {
      const dist = TN_DISTRICTS.find(d => d.name === user.selectedDistrict);
      if (dist) return { lat: dist.lat, lng: dist.lng };
    }
    return { lat: user?.lat || 13.0835, lng: user?.lng || 80.2710 };
  };

  const initialCoords = getInitialCoordinates();
  const [lat, setLat] = useState(initialCoords.lat);
  const [lng, setLng] = useState(initialCoords.lng);
  const [locationStatus, setLocationStatus] = useState('Location Active');
  
  // Cases history and filters
  const [cases, setCases] = useState([]);
  const [filterRange, setFilterRange] = useState('All'); // All, Today, This Week, This Month
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Voice call simulation overlays
  const [activeCase, setActiveCase] = useState(null);
  const [incomingCall, setIncomingCall] = useState(false);
  const [callListened, setCallListened] = useState(false);

  const trackerInterval = useRef(null);

  const getApiUrl = () => {
    const { protocol, hostname, port } = window.location;
    if (port === '5173') return `${protocol}//${hostname}:5000/api`;
    return `${protocol}//${hostname}${port ? ':' + port : ''}/api`;
  };

  // Load attended cases history
  const loadCaseHistory = async () => {
    try {
      const res = await axios.get(`${getApiUrl()}/alerts`);
      const allCases = res.data;
      
      // Filter cases attended by this police officer
      const attended = allCases.filter(c => c.assignedResponder === user.id);
      setCases(attended);

      // Synch with socket context list
      setLiveAlerts(allCases);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCaseHistory();
    
    // Register tracker interval
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const l1 = pos.coords.latitude;
          const l2 = pos.coords.longitude;
          setLat(l1);
          setLng(l2);
          updateLocation(l1, l2);
          emitLocation(l1, l2);
        },
        () => {
          toast.warn('Browser GPS unavailable. Clicking map simulates geolocation coordinates.');
        }
      );

      trackerInterval.current = setInterval(() => {
        updateLocation(lat, lng);
        emitLocation(lat, lng);
        setLocationStatus('Location Updating');
        setTimeout(() => setLocationStatus('Location Active'), 1000);
      }, 7000);
    }

    return () => clearInterval(trackerInterval.current);
  }, [lat, lng]);

  // Listen for socket dispatches
  useEffect(() => {
    if (assignedAlert) {
      setActiveCase(assignedAlert.alert);
      setIncomingCall(true);
      setCallListened(false);
    }
  }, [assignedAlert]);

  // Simulated coordinate movement
  const handleLocationSimulation = (simLat, simLng) => {
    setLat(simLat);
    setLng(simLng);
    updateLocation(simLat, simLng);
    emitLocation(simLat, simLng);
    toast.success(`Coordinates simulated: (${simLat.toFixed(4)}, ${simLng.toFixed(4)})`);
  };

  // Status updates
  const handleStatusChange = (status) => {
    updateStatus(status);
  };

  const acceptCall = () => {
    setCallListened(true);
    const msg = new SpeechSynthesisUtterance("A woman is in an emergency. Her location has been sent to your mailbox. Please respond immediately.");
    window.speechSynthesis?.speak(msg);
  };

  const updateAlertStatus = async (status, description) => {
    if (!activeCase) return;
    try {
      const res = await axios.patch(`${getApiUrl()}/alerts/${activeCase.id}`, {
        status,
        description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveCase(res.data);
      loadCaseHistory();
      toast.success(`Case status: ${status}`);

      if (status === 'Resolved') {
        setActiveCase(null);
        clearAssignedAlert();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Nearby alert calculations sorted by distance
  const getNearbyAlerts = () => {
    return liveAlerts
      .filter(a => a.status !== 'Resolved')
      .map(a => {
        const dist = calculateDistance(lat, lng, a.lat, a.lng);
        return { ...a, distanceKm: dist };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  };

  const nearbyList = getNearbyAlerts();

  // Filters for case history table
  const getFilteredCases = () => {
    return cases.filter(c => {
      const date = new Date(c.triggerTime);
      const now = new Date();
      
      if (filterRange === 'Today') {
        return date.toDateString() === now.toDateString();
      }
      if (filterRange === 'This Week') {
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
      if (filterRange === 'This Month') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
      if (filterRange === 'Custom' && customStart && customEnd) {
        const start = new Date(customStart);
        const end = new Date(customEnd);
        return date >= start && date <= end;
      }
      return true;
    });
  };

  const historyList = getFilteredCases();

  // Stats calculation
  const totalAttended = cases.length;
  const totalAssigned = cases.filter(c => c.status !== 'Resolved').length;
  const activeCasesCount = liveAlerts.filter(c => c.status !== 'Resolved').length;
  const resolvedCount = cases.filter(c => c.status === 'Resolved').length;

  const averageResponseMinutes = () => {
    const accepted = cases.filter(c => c.acceptedTime);
    if (accepted.length === 0) return '2.5 Min';
    const sum = accepted.reduce((acc, c) => acc + (new Date(c.acceptedTime) - new Date(c.triggerTime)), 0);
    return `${((sum / accepted.length) / 60000).toFixed(1)} Min`;
  };

  // Recharts parameters
  const chartData = [
    { name: 'Mon', attended: 2, resolved: 2 },
    { name: 'Tue', attended: 4, resolved: 3 },
    { name: 'Wed', attended: 1, resolved: 1 },
    { name: 'Thu', attended: 3, resolved: 3 },
    { name: 'Fri', attended: 5, resolved: 4 },
    { name: 'Sat', attended: totalAttended, resolved: resolvedCount }
  ];

  return (
    <div className="min-h-screen bg-[#070A13] text-slate-300 flex overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#0B0F19] border-r border-slate-900 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-slate-900 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-extrabold text-xs tracking-wider uppercase text-white">POLICE COMMAND</span>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest -mt-0.5">District Dispatch</p>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {[
              { id: 'dashboard', label: 'Operational Panel', icon: Activity },
              { id: 'nearby-alerts', label: 'Nearby Emergencies', icon: Bell },
              { id: 'live-map', label: 'District Live Map', icon: MapPin },
              { id: 'history', label: 'Attended Cases', icon: Clock },
              { id: 'profile', label: 'Officer Profile', icon: User }
            ].map(tabItem => {
              const TabIcon = tabItem.icon;
              return (
                <button
                  key={tabItem.id}
                  onClick={() => setActiveTab(tabItem.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    activeTab === tabItem.id 
                      ? 'bg-blue-600/10 text-blue-500 border-l-2 border-blue-500 rounded-l-none' 
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
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-blue-500 text-xs">P</div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-200 truncate">{user?.name}</div>
              <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Badge: {user?.id}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-2 border border-slate-800 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Panel */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header */}
        <header className="px-6 py-4 border-b border-slate-900 bg-[#0B0F19] flex items-center justify-between">
          <div>
            <h2 className="text-xs font-black text-white uppercase tracking-wider">
              {activeTab} Deck
            </h2>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              District: {user?.selectedDistrict || 'Chennai'} · GPS Status: <b>{locationStatus}</b>
            </p>
          </div>

          {/* Availability Status dropdown */}
          <div className="flex items-center gap-3">
            <label className="text-[9px] uppercase font-bold text-slate-500">Officer Status:</label>
            <select
              value={user?.availabilityStatus || 'Available'}
              onChange={e => handleStatusChange(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0B0F19] text-xs font-bold text-slate-300"
            >
              <option value="Available">AVAILABLE</option>
              <option value="On Duty">ON DUTY</option>
              <option value="Responding">RESPONDING</option>
              <option value="Busy">BUSY</option>
              <option value="Offline">OFFLINE</option>
            </select>
          </div>
        </header>

        {/* Tab 1: Operational Panel */}
        {activeTab === 'dashboard' && (
          <div className="p-6 space-y-6 animate-fade-in">
            
            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Attended Cases', value: totalAttended },
                { label: 'Assigned Cases', value: totalAssigned },
                { label: 'Active Alerts', value: activeCasesCount, color: 'text-red-500' },
                { label: 'Resolved Cases', value: resolvedCount },
                { label: 'Avg Response Time', value: averageResponseMinutes() }
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-900 bg-slate-950/20">
                  <div className={`text-xl font-black ${stat.color || 'text-white'}`}>{stat.value}</div>
                  <div className="text-[9px] uppercase font-bold tracking-widest text-slate-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Split row: District Map and Active assignments */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Map display preview */}
              <div className="lg:col-span-2 flex flex-col space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> District Map Mappings
                </div>
                <div className="h-[280px] rounded-xl border border-slate-900 overflow-hidden relative">
                  <div className="absolute top-4 left-4 z-[1000] p-2.5 rounded-lg bg-slate-950/80 border border-slate-900 text-[10px] font-semibold text-slate-400">
                    * Click anywhere to simulate moving your location.
                  </div>
                  <MapContainer
                    center={[lat, lng]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                  >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <LocationSimulatorEvents onSimulate={handleLocationSimulation} />
                    
                    <Marker position={[lat, lng]} icon={icons.police} />
                    
                    {activeCase && (
                      <>
                        <Marker position={[activeCase.lat, activeCase.lng]} icon={icons.activeAlert} />
                        <Polyline positions={[[lat, lng], [activeCase.lat, activeCase.lng]]} color="red" dashArray="5, 10" />
                      </>
                    )}
                  </MapContainer>
                </div>
              </div>

              {/* Active emergency controls */}
              <div className="flex flex-col space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Dispatch controls</h3>
                {activeCase ? (
                  <div className="flex-1 p-5 border border-red-500/20 bg-red-500/5 rounded-xl flex flex-col justify-between text-xs space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between font-mono text-[10px] text-red-500 font-bold">
                        <span>ID: {activeCase.id}</span>
                        <span>{activeCase.status}</span>
                      </div>
                      <div className="text-sm font-bold text-white">Victim: {activeCase.victimName}</div>
                      <div>Contact: <b>{activeCase.victimPhone}</b></div>
                      <div className="text-slate-400">Location Lat: {activeCase.lat.toFixed(4)} · Lng: {activeCase.lng.toFixed(4)}</div>
                    </div>

                    <div className="space-y-2">
                      {(activeCase.status === 'SOS Triggered' || activeCase.status === 'SOS_TRIGGERED' || activeCase.status === 'ALERT_RECEIVED' || activeCase.status === 'RESPONDER_ASSIGNED') && (
                        <button
                          onClick={() => updateAlertStatus('ACCEPTED', 'Police unit accepted case.')}
                          className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-bold text-xs cursor-pointer hover:bg-blue-500 transition-all"
                        >
                          Accept Case
                        </button>
                      )}
                      {(activeCase.status === 'Accepted' || activeCase.status === 'ACCEPTED') && (
                        <button
                          onClick={() => updateAlertStatus('RESPONDING', 'Police is responding.')}
                          className="w-full py-2.5 rounded-lg bg-orange-600 text-white font-bold text-xs cursor-pointer hover:bg-orange-500 transition-all"
                        >
                          Start Responding
                        </button>
                      )}
                      {(activeCase.status === 'Responding' || activeCase.status === 'RESPONDING') && (
                        <button
                          onClick={() => updateAlertStatus('REACHED_LOCATION', 'Reached victim location.')}
                          className="w-full py-2.5 rounded-lg bg-amber-600 text-white font-bold text-xs cursor-pointer"
                        >
                          Mark Reached Location
                        </button>
                      )}
                      {(activeCase.status === 'Reached Location' || activeCase.status === 'REACHED_LOCATION') && (
                        <button
                          onClick={() => updateAlertStatus('RESOLVED', 'Emergency resolved safely.')}
                          className="w-full py-2.5 rounded-lg bg-green-600 text-white font-bold text-xs cursor-pointer hover:bg-green-500 transition-all"
                        >
                          Resolve Incident
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center border border-slate-900 border-dashed rounded-xl py-12 text-slate-500 text-center font-bold">
                    No active emergency dispatch assigned.
                  </div>
                )}
              </div>

            </div>

            {/* Recharts Analytics comparing Cases Attended vs Cases Resolved */}
            <div className="p-5 border border-slate-900 bg-[#0B0F19]/20 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Case Activity Analytics</h3>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                    <Bar dataKey="attended" name="Attended" fill="#3b82f6" />
                    <Bar dataKey="resolved" name="Resolved" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Nearby alerts */}
        {activeTab === 'nearby-alerts' && (
          <div className="p-6 space-y-4 animate-fade-in">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nearby Active Emergency Alerts</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nearbyList.map(a => (
                <div key={a.id} className="p-4 border border-slate-900 bg-slate-950/20 rounded-xl space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-red-500 font-bold">{a.id}</span>
                    <span className="font-semibold text-slate-400">{a.distanceKm.toFixed(2)} km away</span>
                  </div>
                  <div>Victim Name: <b>{a.victimName}</b></div>
                  <div>Alert Time: <b>{new Date(a.triggerTime).toLocaleTimeString()}</b></div>
                  
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setActiveCase(a);
                        toast.success(`Selected alert ${a.id} for map mapping.`);
                      }}
                      className="flex-1 py-1.5 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 font-bold cursor-pointer"
                    >
                      View on Map
                    </button>
                    {(a.status === 'SOS Triggered' || a.status === 'SOS_TRIGGERED' || a.status === 'ALERT_RECEIVED' || a.status === 'RESPONDER_ASSIGNED') && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await axios.patch(`${getApiUrl()}/alerts/${a.id}`, {
                              status: 'ACCEPTED',
                              description: 'Police accepted emergency alert.'
                            }, {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            setActiveCase(res.data);
                            loadCaseHistory();
                            toast.success(`Case ${a.id} Accepted.`);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="flex-1 py-1.5 rounded bg-blue-600 hover:bg-blue-500 font-bold text-white cursor-pointer"
                      >
                        Accept Case
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: District Live Map */}
        {activeTab === 'live-map' && (
          <div className="p-6 space-y-4 flex-1 flex flex-col min-h-0 animate-fade-in">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">District Operations Map</h3>
            
            <div className="flex-1 rounded-xl border border-slate-900 overflow-hidden min-h-[400px]">
              <MapContainer
                center={[lat, lng]}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                
                <Marker position={[lat, lng]} icon={icons.police} />

                {/* Plot active cases in district */}
                {liveAlerts.filter(a => a.status !== 'Resolved').map(a => (
                  <Marker key={a.id} position={[a.lat, a.lng]} icon={icons.activeAlert}>
                    <Popup>
                      <div className="text-xs">
                        <span className="font-bold text-red-500">{a.id}</span>
                        <p>{a.victimName}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        )}

        {/* Tab 4: Attended Cases / Case History */}
        {activeTab === 'history' && (
          <div className="p-6 space-y-4 animate-fade-in text-xs">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Case History Logs</h3>
              
              <div className="flex items-center gap-3">
                <select
                  value={filterRange}
                  onChange={e => setFilterRange(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0B0F19] text-xs font-bold"
                >
                  <option value="All">All Ranges</option>
                  <option value="Today">Today</option>
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                  <option value="Custom">Custom Date Range</option>
                </select>

                {filterRange === 'Custom' && (
                  <div className="flex items-center gap-2">
                    <input 
                      type="date" 
                      className="px-2 py-1 rounded bg-[#0B0F19] border border-slate-800"
                      value={customStart}
                      onChange={e => setCustomStart(e.target.value)}
                    />
                    <span>to</span>
                    <input 
                      type="date" 
                      className="px-2 py-1 rounded bg-[#0B0F19] border border-slate-800"
                      value={customEnd}
                      onChange={e => setCustomEnd(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950/20">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    <th className="px-4 py-3">Emergency ID</th>
                    <th className="px-4 py-3">Victim</th>
                    <th className="px-4 py-3">Trigger Time</th>
                    <th className="px-4 py-3">Arrival Time</th>
                    <th className="px-4 py-3">Resolution Time</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyList.map(h => (
                    <tr key={h.id} className="border-b border-slate-900 text-slate-300">
                      <td className="px-4 py-3 font-mono font-bold text-red-500">{h.id}</td>
                      <td className="px-4 py-3 font-bold">{h.victimName}</td>
                      <td className="px-4 py-3">{new Date(h.triggerTime).toLocaleString()}</td>
                      <td className="px-4 py-3">{h.arrivalTime ? new Date(h.arrivalTime).toLocaleTimeString() : 'N/A'}</td>
                      <td className="px-4 py-3">{h.resolutionTime ? new Date(h.resolutionTime).toLocaleTimeString() : 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
                          h.status === 'Resolved' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                        }`}>{h.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Incoming Call Telephony Modal Overlay */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 p-6 bg-slate-900 text-slate-100 text-center shadow-2xl relative">
            
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
              <Volume2 className="w-10 h-10 text-red-500 animate-pulse" />
            </div>

            <span className="text-[10px] uppercase font-bold tracking-wider text-red-500">🚨 Automated Safety Band Voice Alert Call</span>
            <h3 className="text-lg font-extrabold mt-1 mb-4">INCOMING EMERGENCY CALL</h3>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs italic leading-relaxed mb-6">
              "A woman is in an emergency. Her location has been sent to your mailbox. Please respond immediately."
            </div>

            <div className="flex gap-3">
              {!callListened ? (
                <button
                  onClick={acceptCall}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:opacity-95 text-white text-xs font-bold cursor-pointer"
                >
                  Answer and Listen to Call
                </button>
              ) : (
                <button
                  onClick={() => setIncomingCall(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                >
                  Acknowledge and Close Call
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
