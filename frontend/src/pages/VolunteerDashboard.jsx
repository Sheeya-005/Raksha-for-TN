import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { 
  Users, Radio, Activity, Navigation, CheckCircle, Clock, MapPin, 
  Phone, LogOut, User, Bell, Volume2, Home, HeartPulse, AlertTriangle
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getStatusBadge, timeAgo } from '../utils/helpers';
import { TN_DISTRICTS } from '../data/districts';
import toast from 'react-hot-toast';

// Custom icons
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
  volunteer: createMarkerIcon('#22c55e'),   // GREEN = Volunteer (GREEN available responder)
  police: createMarkerIcon('#3b82f6'),      // BLUE = Police Officer
  victim: createMarkerIcon('#ef4444'),      // RED = Active Emergency
};

// Handle map click for coordinate simulator fallback
function LocationSimulatorEvents({ onSimulate }) {
  useMapEvents({
    click(e) {
      onSimulate(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// Distance helper
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

export default function VolunteerDashboard() {
  const { isDark } = useTheme();
  const { user, token, logout, updateLocation, updateStatus } = useAuth();
  const { socket, assignedAlert, clearAssignedAlert, emitLocation, liveAlerts, setLiveAlerts } = useSocket();

  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, nearby-emergencies, district-map, accepted, history
  
  const getInitialCoordinates = () => {
    if (user?.selectedDistrict) {
      const dist = TN_DISTRICTS.find(d => d.name === user.selectedDistrict);
      if (dist) return { lat: dist.lat, lng: dist.lng };
    }
    return { lat: user?.lat || 13.0850, lng: user?.lng || 80.2750 };
  };

  const initialCoords = getInitialCoordinates();
  const [lat, setLat] = useState(initialCoords.lat);
  const [lng, setLng] = useState(initialCoords.lng);
  const [locationStatus, setLocationStatus] = useState('Location Active');

  const [cases, setCases] = useState([]);
  const [activeCase, setActiveCase] = useState(null);
  const [incomingCall, setIncomingCall] = useState(false);
  const [callListened, setCallListened] = useState(false);

  const trackerInterval = useRef(null);
  const activeCaseIdRef = useRef(null);

  const getApiUrl = () => {
    const { protocol, hostname, port } = window.location;
    if (port === '5173') return `${protocol}//${hostname}:5000/api`;
    return `${protocol}//${hostname}${port ? ':' + port : ''}/api`;
  };

  const loadCaseHistory = async () => {
    try {
      const res = await axios.get(`${getApiUrl()}/alerts`);
      const allCases = res.data;
      
      const assisted = allCases.filter(c => c.assignedResponder === user.id);
      setCases(assisted);
      setLiveAlerts(allCases);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCaseHistory();

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
          toast.warn('GPS unavailable. Click map to set coordinates.');
        }
      );

      trackerInterval.current = setInterval(() => {
        updateLocation(lat, lng);
        emitLocation(lat, lng);
        setLocationStatus('Location Updating');
        setTimeout(() => setLocationStatus('Location Active'), 1000);
      }, 8000);
    }

    return () => clearInterval(trackerInterval.current);
  }, [lat, lng]);

  useEffect(() => {
    if (assignedAlert) {
      if (activeCaseIdRef.current !== assignedAlert.alert.id) {
        activeCaseIdRef.current = assignedAlert.alert.id;
        setIncomingCall(true);
        setCallListened(false);
      }
      setActiveCase(assignedAlert.alert);
    } else {
      setActiveCase(null);
      activeCaseIdRef.current = null;
    }
  }, [assignedAlert]);

  const handleLocationSimulation = (simLat, simLng) => {
    setLat(simLat);
    setLng(simLng);
    updateLocation(simLat, simLng);
    emitLocation(simLat, simLng);
    toast.success(`Position simulated: (${simLat.toFixed(4)}, ${simLng.toFixed(4)})`);
  };

  const handleStatusChange = (status) => {
    updateStatus(status);
  };

  const acceptCall = () => {
    setCallListened(true);
    const dangerMsg = activeCase?.message || "I am in danger!";
    const msg = new SpeechSynthesisUtterance(`A woman is in an emergency. Her message says, "${dangerMsg}". Please respond immediately.`);
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

  // Metrics
  const casesAccepted = cases.length;
  const casesAssisted = cases.filter(c => c.status === 'Resolved').length;
  const resolvedCount = cases.filter(c => c.status === 'Resolved').length;

  return (
    <div className="min-h-screen bg-[#070A13] text-slate-300 flex overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#0B0F19] border-r border-slate-900 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-slate-900 flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center text-white shadow-lg">
              <Users className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-extrabold text-xs tracking-wider uppercase text-white">VOLUNTEER DECK</span>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest -mt-0.5">Safety Circle</p>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {[
              { id: 'dashboard', label: 'Safety Panel', icon: Activity },
              { id: 'nearby-emergencies', label: 'Nearby Emergencies', icon: Bell },
              { id: 'district-map', label: 'District Map', icon: MapPin },
              { id: 'history', label: 'My Assisted Cases', icon: Clock }
            ].map(tabItem => {
              const TabIcon = tabItem.icon;
              return (
                <button
                  key={tabItem.id}
                  onClick={() => setActiveTab(tabItem.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    activeTab === tabItem.id 
                      ? 'bg-cyan-600/10 text-cyan-500 border-l-2 border-cyan-500 rounded-l-none' 
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
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center font-bold text-cyan-500 text-xs">V</div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-200 truncate">{user?.name}</div>
              <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">ID: {user?.id}</p>
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

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top bar status */}
        <header className="px-6 py-4 border-b border-slate-900 bg-[#0B0F19] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              {activeTab.replace('-', ' ')}
            </h2>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              District: {user?.selectedDistrict || 'Chennai'} · GPS Tracker: <b>{locationStatus}</b>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-[9px] uppercase font-bold text-slate-500">My Availability:</label>
            <select
              value={user?.availabilityStatus || 'Available'}
              onChange={e => handleStatusChange(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0B0F19] text-xs font-bold text-slate-300"
            >
              <option value="Available">AVAILABLE</option>
              <option value="Responding">RESPONDING</option>
              <option value="Busy">BUSY</option>
              <option value="Offline">OFFLINE</option>
            </select>
          </div>
        </header>

        {/* Tab 1: Safety Panel Overview */}
        {activeTab === 'dashboard' && (
          <div className="p-6 space-y-6 animate-fade-in">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/20">
                <div className="text-xl font-black text-white">{user?.name}</div>
                <div className="text-[9px] uppercase font-bold tracking-widest text-slate-500 mt-1">Volunteer Name</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/20">
                <div className="text-xl font-black text-white">{casesAccepted}</div>
                <div className="text-[9px] uppercase font-bold tracking-widest text-slate-500 mt-1">Cases Accepted</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/20">
                <div className="text-xl font-black text-white">{casesAssisted}</div>
                <div className="text-[9px] uppercase font-bold tracking-widest text-slate-500 mt-1">Cases Assisted</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/20">
                <div className="text-xl font-black text-green-500">{resolvedCount}</div>
                <div className="text-[9px] uppercase font-bold tracking-widest text-slate-500 mt-1">Resolved Cases</div>
              </div>
            </div>

            {/* Map and Active controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Map */}
              <div className="lg:col-span-2 flex flex-col space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> District Map Mappings
                </div>
                
                <div className="h-[280px] rounded-xl border border-slate-900 overflow-hidden relative">
                  <div className="absolute top-4 left-4 z-[1000] p-2.5 rounded-lg bg-slate-950/80 border border-slate-900 text-[10px] font-semibold text-slate-400">
                    * Click map to simulate coordinates.
                  </div>
                  <MapContainer
                    center={[lat, lng]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                  >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <LocationSimulatorEvents onSimulate={handleLocationSimulation} />
                    
                    <Marker position={[lat, lng]} icon={icons.volunteer} />

                    {activeCase && (
                      <>
                        <Marker position={[activeCase.lat, activeCase.lng]} icon={icons.victim} />
                        <Polyline positions={[[lat, lng], [activeCase.lat, activeCase.lng]]} color="red" dashArray="5, 10" />
                      </>
                    )}
                  </MapContainer>
                </div>
              </div>

              {/* Active emergency overlay */}
              <div className="flex flex-col space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Incident Progress</h3>
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
                      <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-semibold tracking-wide">
                        ⚠️ Msg: "{activeCase.message || 'I am in danger!'}"
                      </div>
                    </div>

                    <div className="space-y-2">
                      {(activeCase.status === 'SOS Triggered' || activeCase.status === 'SOS_TRIGGERED' || activeCase.status === 'ALERT_RECEIVED' || activeCase.status === 'RESPONDER_ASSIGNED') && (
                        <button
                          onClick={() => updateAlertStatus('ACCEPTED', 'Volunteer accepted emergency case.')}
                          className="w-full py-2.5 rounded-lg bg-cyan-600 text-white font-bold text-xs cursor-pointer hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-500/20"
                        >
                          Accept Emergency
                        </button>
                      )}
                      {(activeCase.status === 'Accepted' || activeCase.status === 'ACCEPTED') && (
                        <button
                          onClick={() => updateAlertStatus('RESPONDING', 'Volunteer is responding.')}
                          className="w-full py-2.5 rounded-lg bg-orange-600 text-white font-bold text-xs cursor-pointer hover:bg-orange-500 transition-all shadow-lg"
                        >
                          Start Responding
                        </button>
                      )}
                      {(activeCase.status === 'Responding' || activeCase.status === 'RESPONDING') && (
                        <button
                          onClick={() => updateAlertStatus('REACHED_LOCATION', 'Reached victim location.')}
                          className="w-full py-2.5 rounded-lg bg-amber-600 text-white font-bold text-xs cursor-pointer"
                        >
                          Mark Arrived
                        </button>
                      )}
                      {(activeCase.status === 'Reached Location' || activeCase.status === 'REACHED_LOCATION') && (
                        <button
                          onClick={() => updateAlertStatus('RESOLVED', 'Emergency resolved safely.')}
                          className="w-full py-2.5 rounded-lg bg-green-600 text-white font-bold text-xs cursor-pointer hover:bg-green-500 transition-all"
                        >
                          Resolve Emergency
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center border border-slate-900 border-dashed rounded-xl py-12 text-slate-500 text-center font-bold">
                    No active safety calls assigned.
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* Tab 2: Nearby active cases */}
        {activeTab === 'nearby-emergencies' && (
          <div className="p-6 space-y-4 animate-fade-in">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nearby Active Emergencies sorted by distance</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nearbyList.map(a => (
                <div key={a.id} className="p-4 border border-slate-900 bg-slate-950/20 rounded-xl space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-red-500 font-bold">Emergency #TN-2026-{a.id.split('_')[1] || '0001'}</span>
                    <span className="font-semibold text-slate-400">{a.distanceKm.toFixed(2)} km</span>
                  </div>
                  <div>Status: <span className="font-bold text-slate-300">Waiting for Responder</span></div>
                  <div>Coordinates: <span className="font-mono text-slate-400">{a.lat.toFixed(4)}, {a.lng.toFixed(4)}</span></div>
                  
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => {
                        setActiveCase(a);
                        setActiveTab('dashboard');
                        toast.success(`Locating alert ${a.id} on dashboard.`);
                      }}
                      className="w-full py-2 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 font-bold cursor-pointer text-white text-xs"
                    >
                      View Location
                    </button>
                    {(a.status === 'SOS Triggered' || a.status === 'SOS_TRIGGERED' || a.status === 'ALERT_RECEIVED' || a.status === 'RESPONDER_ASSIGNED') && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await axios.patch(`${getApiUrl()}/alerts/${a.id}`, {
                              status: 'ACCEPTED',
                              description: 'Volunteer accepted emergency case.'
                            }, {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            setActiveCase(res.data);
                            loadCaseHistory();
                            toast.success(`Emergency Accepted.`);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="w-full py-2 rounded bg-cyan-600 hover:bg-cyan-555 font-bold text-white cursor-pointer text-xs"
                      >
                        Accept Emergency
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: District Map */}
        {activeTab === 'district-map' && (
          <div className="p-6 space-y-4 flex-1 flex flex-col min-h-0 animate-fade-in">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">District Map Monitor</h3>
            
            <div className="flex-1 rounded-xl border border-slate-900 overflow-hidden min-h-[400px]">
              <MapContainer
                center={[lat, lng]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                
                <Marker position={[lat, lng]} icon={icons.volunteer} />

                {liveAlerts.filter(a => a.status !== 'Resolved').map(a => (
                  <Marker key={a.id} position={[a.lat, a.lng]} icon={icons.victim}>
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

        {/* Tab 4: History */}
        {activeTab === 'history' && (
          <div className="p-6 space-y-4 animate-fade-in text-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">My Assisted Cases History</h3>
            
            <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950/20">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    <th className="px-4 py-3">Emergency ID</th>
                    <th className="px-4 py-3">Victim</th>
                    <th className="px-4 py-3">Assigned Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map(h => (
                    <tr key={h.id} className="border-b border-slate-900 text-slate-300">
                      <td className="px-4 py-3 font-mono font-bold text-red-500">{h.id}</td>
                      <td className="px-4 py-3 font-bold">{h.victimName}</td>
                      <td className="px-4 py-3">{new Date(h.triggerTime).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded font-bold text-[9px] uppercase bg-green-500/10 text-green-500">{h.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Voice call overlay */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 p-6 bg-slate-900 text-slate-100 text-center shadow-2xl relative">
            
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
              <Volume2 className="w-10 h-10 text-red-500 animate-pulse" />
            </div>

            <span className="text-[10px] uppercase font-bold tracking-wider text-red-500">🚨 Automated Safety Band Voice Alert Call</span>
            <h3 className="text-lg font-extrabold mt-1 mb-4">INCOMING EMERGENCY CALL</h3>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs italic leading-relaxed mb-4">
              "A woman is in an emergency. Her location has been sent to your mailbox. Please respond immediately."
            </div>

            <div className="p-3 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
              <span>Message: "{activeCase?.message || 'I am in danger!'}"</span>
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
