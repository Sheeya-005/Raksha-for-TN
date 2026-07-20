import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { 
  HeartPulse, Shield, AlertTriangle, Navigation, MapPin, 
  Smartphone, Activity, Power, LogOut, CheckCircle, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

// Custom red victim pulse marker
const victimIcon = L.divIcon({
  html: `<div style="
    width: 16px; height: 16px;
    background: #ef4444;
    border: 2.5px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 12px #ef4444;
  " class="animate-pulse"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// Custom responder marker
const responderIcon = L.divIcon({
  html: `<div style="
    width: 14px; height: 14px;
    background: #3b82f6;
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 8px #3b82f6;
  "></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

export default function PhoneSosPage() {
  const { user, token, login, logout } = useAuth();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();

  // Login inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Location States
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Location Access Required');
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  // SOS state
  const [emergencyId, setEmergencyId] = useState(null);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [emergencyStatus, setEmergencyStatus] = useState('idle');
  const [assignedResponder, setAssignedResponder] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const watchIdRef = useRef(null);
  const activeAlertRef = useRef(null);

  // Authenticate from local screen
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email and password required.');
      return;
    }
    try {
      await login(email, password);
      toast.success('Device Authenticated successfully.');
    } catch (err) {
      toast.error(err.message || 'Verification failed');
    }
  };

  // Location Permission and Tracking Setup
  useEffect(() => {
    if (!user) return;

    if (!navigator.geolocation) {
      setLocationStatus('Location Disabled');
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    // Check permissions and get initial position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setAccuracy(pos.coords.accuracy);
        setLocationStatus('Location Enabled');
        setLastUpdateTime(new Date());
      },
      (err) => {
        console.error('GPS initial access error:', err);
        if (err.code === 1) {
          setLocationStatus('Location Permission Denied');
        } else {
          setLocationStatus('Location Disabled');
        }
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, [user]);

  // Handle emergency live updates on real-time sockets
  useEffect(() => {
    if (!socket || !emergencyId) return;

    // Listen for dispatches to this emergency alert status
    socket.on(`alert:status:${emergencyId}`, (data) => {
      console.log('Emergency state updated:', data);
      setEmergencyStatus(data.status);
      
      // Look up and attach responder details if assigned
      if (data.assignedResponder) {
        setAssignedResponder({
          id: data.assignedResponder,
          type: data.responderType,
          lat: data.responderLat,
          lng: data.responderLng,
          status: data.status
        });
      } else {
        setAssignedResponder(null);
      }

      if (data.status === 'RESOLVED' || data.status === 'Resolved' || data.status === 'CLOSED') {
        toast.success('The emergency alert has been resolved safely.');
        stopTracking();
      }
    });

    return () => {
      socket.off(`alert:status:${emergencyId}`);
    };
  }, [socket, emergencyId]);

  // Clean up watchers on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const triggerEmergency = async () => {
    setShowConfirm(false);
    
    if (lat === null || lng === null) {
      toast.error('Coordinates not acquired yet. Please wait for GPS.');
      return;
    }

    try {
      // 1. Generate Emergency ID
      const generatedId = `ALT_${Date.now()}`;
      setEmergencyId(generatedId);
      setEmergencyStatus('SOS_TRIGGERED');
      setEmergencyActive(true);
      activeAlertRef.current = generatedId;

      // 2. Send Alert request to backend
      const payload = {
        emergencyId: generatedId,
        victimId: user.id,
        latitude: lat,
        longitude: lng,
        accuracy: accuracy,
        timestamp: new Date().toISOString(),
        emergencyStatus: 'SOS_TRIGGERED',
        message: "I am in danger! (நான் ஆபத்தில் இருக்கிறேன்!)"
      };

      const res = await axios.post(`http://${window.location.hostname}:5000/api/emergency/sos`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.error('🚨 EMERGENCY BROADCASTED! Dispatchers notified.', { duration: 5000 });

      // Handle responder initial state if returned
      if (res.data?.responder) {
        setAssignedResponder({
          id: res.data.responder.id,
          name: res.data.responder.name,
          phone: res.data.responder.phone,
          type: res.data.responder.role,
          distanceKm: res.data.responder.distanceKm
        });
      }

      // 3. Initiate continuous tracking
      startTracking(generatedId);
    } catch (err) {
      console.error(err);
      toast.error('Failed to trigger emergency. Try again.');
      setEmergencyActive(false);
      setEmergencyStatus('idle');
    }
  };

  // Start continuous watchPosition tracking
  const startTracking = (alertId) => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const currentLat = pos.coords.latitude;
        const currentLng = pos.coords.longitude;
        const currentAcc = pos.coords.accuracy;

        setLat(currentLat);
        setLng(currentLng);
        setAccuracy(currentAcc);
        setLastUpdateTime(new Date());

        console.log(`Live GPS Update: (${currentLat}, ${currentLng})`);

        // Send location coordinates update to backend
        try {
          await axios.patch(`http://${window.location.hostname}:5000/api/emergency/sos/${alertId}/location`, {
            latitude: currentLat,
            longitude: currentLng,
            accuracy: currentAcc
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (err) {
          console.error('Failed to broadcast live location update:', err);
        }
      },
      (err) => {
        console.error('GPS Tracking watch position error:', err);
        toast.error('GPS connection lost.');
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setEmergencyActive(false);
    setEmergencyStatus('idle');
    setEmergencyId(null);
    setAssignedResponder(null);
  };

  const cancelEmergency = async () => {
    if (!emergencyId) return;
    try {
      await axios.patch(`http://${window.location.hostname}:5000/api/alerts/${emergencyId}`, {
        status: 'CLOSED',
        description: 'Alert canceled/closed by victim device.'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Emergency canceled.');
      stopTracking();
    } catch (err) {
      console.error(err);
      toast.error('Failed to cancel emergency. Responders may have already arrived.');
    }
  };

  // If not logged in, render authentication box
  if (!user) {
    return (
      <div className="min-h-screen bg-[#070A13] text-slate-100 flex flex-col justify-center p-6 relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-sm mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-500/10 rounded-xl border border-red-500/20 mb-2">
              <HeartPulse className="w-6 h-6 text-red-500 animate-pulse" />
            </div>
            <h1 className="text-xl font-black tracking-wider text-white">SAFEWATCH TN</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Mobile SOS Console</p>
          </div>

          <div className="p-6 border border-slate-900 bg-slate-950/40 rounded-2xl space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center border-b border-slate-900 pb-3 mb-2">
              Device Authentication
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-500 block">Device Email</label>
                <input
                  type="email"
                  placeholder="email@safetytamil.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-500 block">Access Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold uppercase tracking-wider text-white shadow-lg active:scale-98 transition-all cursor-pointer"
              >
                Authenticate Device
              </button>
            </form>

            <div className="border-t border-slate-900 pt-4 flex flex-col gap-2">
              <button
                onClick={() => { setEmail('volunteer@safetytamil.in'); setPassword('volunteer123'); }}
                className="w-full py-2 border border-slate-800 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-900 transition-all cursor-pointer"
              >
                Autofill Volunteer Demo
              </button>
              <button
                onClick={() => { setEmail('police@safetytamil.in'); setPassword('police123'); }}
                className="w-full py-2 border border-slate-800 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-900 transition-all cursor-pointer"
              >
                Autofill Police Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get status color mappings
  const getStatusLabel = () => {
    switch (locationStatus) {
      case 'Location Enabled': return <span className="text-green-500 font-black">LOCATION ENABLED</span>;
      case 'Location Disabled': return <span className="text-yellow-500 font-black">LOCATION DISABLED</span>;
      case 'Location Permission Denied': return <span className="text-red-500 font-black">LOCATION PERMISSION DENIED</span>;
      default: return <span className="text-slate-400 font-black">LOCATION ACCESS REQUIRED</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#070A13] text-slate-300 flex flex-col font-sans relative">
      
      {/* Decorative vectors */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-900 bg-[#0B0F19]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-rose-600 rounded-lg flex items-center justify-center shadow shadow-red-500/20">
            <HeartPulse className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-xs tracking-wider uppercase text-white">SAFEWATCH TN</h1>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest -mt-0.5">SOS Mobile Node</p>
          </div>
        </div>

        <button 
          onClick={logout}
          className="p-2 border border-slate-850 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Main Body */}
      <main className="flex-1 p-6 flex flex-col space-y-6 max-w-md mx-auto w-full">
        
        {/* Device Status Card */}
        <div className="p-4 border border-slate-900 bg-slate-950/40 rounded-2xl space-y-3 text-xs">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-900 pb-2">
            <span>GPS Tracking Console</span>
            <span>ID: {user.id}</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Location Status:</span>
              <span className="font-bold">{getStatusLabel()}</span>
            </div>

            {lat && lng && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2 rounded bg-slate-900/60 border border-slate-850">
                  <div className="text-[9px] uppercase font-bold text-slate-500">Latitude</div>
                  <div className="font-mono text-[11px] font-semibold text-white mt-0.5">{lat.toFixed(5)}</div>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-850">
                  <div className="text-[9px] uppercase font-bold text-slate-500">Longitude</div>
                  <div className="font-mono text-[11px] font-semibold text-white mt-0.5">{lng.toFixed(5)}</div>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-850">
                  <div className="text-[9px] uppercase font-bold text-slate-500">Accuracy</div>
                  <div className="font-mono text-[11px] font-semibold text-cyan-400 mt-0.5">{accuracy?.toFixed(1)}m</div>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-850">
                  <div className="text-[9px] uppercase font-bold text-slate-500">Last GPS Sync</div>
                  <div className="font-mono text-[11px] font-semibold text-slate-300 mt-0.5">
                    {lastUpdateTime ? lastUpdateTime.toLocaleTimeString() : '—'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SOS Console */}
        {!emergencyActive ? (
          <div className="flex-1 flex flex-col justify-center items-center py-6">
            
            {/* Pulsing Outer Rings */}
            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute w-44 h-44 rounded-full border border-red-500/10 animate-ping duration-1000" />
              <div className="absolute w-36 h-36 rounded-full bg-red-600/5 animate-pulse duration-2000" />
              
              <button
                disabled={locationStatus !== 'Location Enabled'}
                onClick={() => setShowConfirm(true)}
                className={`w-32 h-32 rounded-full font-black text-xl uppercase tracking-wider text-white shadow-xl transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-1 border-4 border-white/10 ${
                  locationStatus === 'Location Enabled'
                    ? 'bg-gradient-to-br from-red-600 to-rose-600 hover:scale-[1.03] shadow-red-600/30'
                    : 'bg-slate-800 text-slate-500 border-slate-850 cursor-not-allowed'
                }`}
              >
                <Power className="w-8 h-8" />
                <span>SOS</span>
              </button>
            </div>

            {locationStatus !== 'Location Enabled' && (
              <p className="text-[10px] uppercase font-extrabold text-red-500 text-center tracking-wider max-w-xs leading-relaxed animate-pulse">
                ⚠️ GPS location access required to enable emergency triggers.
              </p>
            )}
          </div>
        ) : (
          <div className="flex-1 space-y-5 animate-fade-in flex flex-col">
            
            {/* Active Emergency Status Screen */}
            <div className="p-4 border border-red-500/30 bg-red-500/5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center text-red-500 font-extrabold text-xs">
                <span className="flex items-center gap-1.5 animate-pulse">
                  <Activity className="w-4 h-4" /> EMERGENCY SOS ACTIVE
                </span>
                <span className="font-mono text-[10px]">{emergencyId}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <span className="px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-red-500/20 text-red-400">
                    {emergencyStatus.replace('_', ' ')}
                  </span>
                </div>

                {/* Assigned Responder details */}
                {assignedResponder ? (
                  <div className="mt-3 p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-2">
                    <div className="text-[10px] uppercase font-bold text-blue-400 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" /> Assigned Responder Unit
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                      <div>Name: <b className="text-white capitalize">{assignedResponder.type} Unit</b></div>
                      <div>ID: <b>{assignedResponder.id}</b></div>
                      {assignedResponder.distanceKm !== undefined && (
                        <div className="col-span-2 text-cyan-400 font-bold">
                          Responder Proximity: {assignedResponder.distanceKm.toFixed(2)} km
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-900/40 border border-slate-850 border-dashed rounded-xl text-center text-slate-400 font-bold">
                    Calculating nearest responder...
                  </div>
                )}
              </div>

              {/* Map displaying current coordinates */}
              {lat && lng && (
                <div className="h-44 rounded-xl overflow-hidden border border-slate-900 relative">
                  <MapContainer
                    center={[lat, lng]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                  >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <Marker position={[lat, lng]} icon={victimIcon} />
                    {assignedResponder?.lat && (
                      <Marker position={[assignedResponder.lat, assignedResponder.lng]} icon={responderIcon} />
                    )}
                  </MapContainer>
                </div>
              )}

              <button
                onClick={cancelEmergency}
                className="w-full py-3 rounded-xl border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancel Emergency SOS
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-slate-900 p-6 space-y-6 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-lg text-white">EMERGENCY SOS ACTIVATION</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Are you sure you want to send an emergency alert? Responders will be dispatched to your exact GPS location.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-900 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={triggerEmergency}
                className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-95 shadow-lg shadow-red-500/20 transition-all cursor-pointer"
              >
                Send SOS
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
