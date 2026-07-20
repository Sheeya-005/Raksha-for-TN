import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Radio, Heart, Battery, Wifi, Activity, Play, RefreshCw, MapPin, Phone, User, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to handle map clicks and move the marker
function MapEventsHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function BandSimulator() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { connected, emitLocation, emitSmartwatchSos } = useSocket();

  // Smartwatch state variables
  const [victimName, setVictimName] = useState('Priya Dharshini');
  const [victimPhone, setVictimPhone] = useState('+91 9994567890');
  const [deviceId, setDeviceId] = useState('SW_4589');
  const [lat, setLat] = useState(13.0827); // Chennai center default
  const [lng, setLng] = useState(80.2707);
  const [heartRate, setHeartRate] = useState(72);
  const [battery, setBattery] = useState(95);
  const [signalStrength, setSignalStrength] = useState(4); // 1-5
  const [logs, setLogs] = useState([]);
  const [isSendingPings, setIsSendingPings] = useState(false);
  const [sosStatus, setSosStatus] = useState('idle'); // idle, active, resolved

  const addLog = (message) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${message}`, ...prev].slice(0, 100));
  };

  useEffect(() => {
    addLog(`System initialized. Smartwatch ID: ${deviceId}`);
    addLog(`Ready for emergency trigger at location: (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
  }, []);

  // Periodic location ping simulator
  useEffect(() => {
    let pingInterval;
    if (isSendingPings) {
      addLog(`Started continuous tracking pings every 5s.`);
      pingInterval = setInterval(() => {
        // Add minor random noise to lat/lng to simulate walking
        const driftLat = lat + (Math.random() - 0.5) * 0.0005;
        const driftLng = lng + (Math.random() - 0.5) * 0.0005;
        setLat(driftLat);
        setLng(driftLng);

        // Send smartwatch location pin
        if (connected) {
          emitLocation(driftLat, driftLng); // also triggers generic tracking update
        }
        addLog(`Smartwatch Ping: Location(${driftLat.toFixed(5)}, ${driftLng.toFixed(5)}) HR:${heartRate} bpm Battery:${battery}%`);
      }, 5000);
    } else {
      if (logs.length > 0) {
        addLog(`Continuous location tracking paused.`);
      }
    }

    return () => clearInterval(pingInterval);
  }, [isSendingPings, lat, lng, heartRate, battery, connected]);

  const handleMapClick = (clickLat, clickLng) => {
    setLat(clickLat);
    setLng(clickLng);
    addLog(`Map clicked. Coordinates updated to: (${clickLat.toFixed(5)}, ${clickLng.toFixed(5)})`);
  };

  const triggerSOS = () => {
    setSosStatus('active');
    addLog(`🚨 SOS EMERGENCY TRIGGERED! SOS Button Pressed.`);
    addLog(`Heart rate spiked to: ${heartRate + 40} bpm`);
    setHeartRate(prev => Math.min(prev + 40, 140));

    const sosPayload = {
      victimId: deviceId,
      victimName,
      victimPhone,
      lat,
      lng,
      battery,
      heartRate: heartRate + 40
    };

    // Emit SOS WebSocket event
    if (connected) {
      emitSmartwatchSos(sosPayload);
      addLog(`SOS payload transmitted to server via WebSocket.`);
    } else {
      addLog(`❌ WebSocket disconnected! SOS could not be sent to server.`);
      toast.error('Cannot trigger SOS: server is disconnected.');
    }
  };

  const resetSOS = () => {
    setSosStatus('idle');
    setHeartRate(72);
    addLog(`Emergency alert cleared. Smartwatch diagnostic state returned to normal.`);
  };

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const victimIcon = L.divIcon({
    html: `<div style="
      width: 18px; height: 18px;
      background: #ef4444;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 12px #ef4444;
      animation: livePulse 1.2s ease-in-out infinite;
    "></div>`,
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${isDark ? 'dark bg-slate-950 text-slate-100' : 'light bg-slate-50 text-slate-800'}`}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')} 
            className={`p-2 rounded-xl border ${isDark ? 'border-slate-800 hover:bg-slate-900' : 'border-slate-200 hover:bg-slate-100'}`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Wearable Safety Band Simulator</h1>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Simulate location pings and physical button SOS triggers.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="font-semibold">{connected ? 'Socket Connected' : 'Socket Disconnected'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Device Mock & Controls */}
        <div className="space-y-6">
          
          {/* Diagnostic Stats Card */}
          <div className={`card p-5 border ${isDark ? 'dark bg-slate-900/60 border-slate-800' : 'light bg-white border-slate-200'}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-red-500 flex items-center gap-1.5">
              <Activity className="w-4 h-4 animate-pulse" /> Diagnostic Controller
            </h3>
            
            <div className="space-y-4">
              {/* Victim Profile Details */}
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider mb-1">Victim Name</label>
                <input 
                  type="text" 
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'}`}
                  value={victimName}
                  onChange={e => setVictimName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider mb-1">Victim Phone</label>
                <input 
                  type="text" 
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'}`}
                  value={victimPhone}
                  onChange={e => setVictimPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider mb-1">Smartwatch ID</label>
                <input 
                  type="text" 
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'}`}
                  value={deviceId}
                  onChange={e => setDeviceId(e.target.value)}
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                {/* Heart Rate Slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> Heart Rate</span>
                    <span>{heartRate} bpm</span>
                  </div>
                  <input 
                    type="range" min="50" max="150" className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                    value={heartRate} onChange={e => setHeartRate(Number(e.target.value))}
                  />
                </div>

                {/* Battery Slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1"><Battery className="w-3.5 h-3.5 text-green-500" /> Battery Status</span>
                    <span>{battery}%</span>
                  </div>
                  <input 
                    type="range" min="5" max="100" className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                    value={battery} onChange={e => setBattery(Number(e.target.value))}
                  />
                </div>

                {/* Tracking status buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => setIsSendingPings(!isSendingPings)}
                    className={`flex items-center justify-center gap-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      isSendingPings 
                        ? 'bg-green-500 text-white shadow-lg' 
                        : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSendingPings ? 'animate-spin' : ''}`} />
                    {isSendingPings ? 'Pings Active' : 'Enable Pings'}
                  </button>
                  <button
                    onClick={() => {
                      setLat(13.0827);
                      setLng(80.2707);
                      addLog('Coordinates reset to default Chennai center.');
                    }}
                    className={`flex items-center justify-center gap-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      isDark ? 'border-slate-800 hover:bg-slate-900 text-slate-400' : 'border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" /> Center Location
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Smartwatch UI trigger Mock */}
          <div className={`card p-5 border flex flex-col items-center justify-center text-center ${
            isDark ? 'dark bg-slate-900/60 border-slate-800' : 'light bg-white border-slate-200'
          }`}>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-6">Physical Wearable Simulation</span>
            
            {/* The Glowing RED SOS Button */}
            <div className="relative mb-6">
              {sosStatus === 'active' && (
                <>
                  <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping scale-150 pointer-events-none" />
                  <div className="absolute inset-0 bg-rose-500/30 rounded-full animate-pulse scale-125 pointer-events-none" />
                </>
              )}
              <button
                onClick={sosStatus === 'active' ? resetSOS : triggerSOS}
                className={`w-32 h-32 rounded-full flex flex-col items-center justify-center border-4 border-white dark:border-slate-800 transition-all duration-300 shadow-2xl cursor-pointer ${
                  sosStatus === 'active'
                    ? 'bg-gradient-to-tr from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700'
                    : 'bg-gradient-to-tr from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 shadow-red-500/25 active:scale-95'
                }`}
              >
                <Radio className={`w-8 h-8 text-white mb-1.5 ${sosStatus === 'active' ? 'animate-bounce' : 'animate-pulse'}`} />
                <span className="text-white font-extrabold text-sm tracking-wider uppercase">
                  {sosStatus === 'active' ? 'CLEAR SOS' : 'PRESS SOS'}
                </span>
              </button>
            </div>

            <p className="text-[10px] text-slate-500 max-w-xs font-semibold leading-relaxed uppercase">
              {sosStatus === 'active' 
                ? 'EMERGENCY BROADCAST ACTIVE. PRESS AGAIN TO SHUT DOWN SIGNAL.'
                : 'Pressing triggers immediate nearest responder dispatch workflow.'
              }
            </p>
          </div>

        </div>

        {/* Center/Right: Map selector */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          
          {/* Map display */}
          <div className={`card overflow-hidden border flex-1 h-[400px] relative ${
            isDark ? 'dark bg-slate-900/60 border-slate-800' : 'light bg-white border-slate-200'
          }`}>
            <div className="absolute top-4 left-4 z-[1000] p-3 rounded-xl backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-bold flex items-center gap-1 text-red-500"><MapPin className="w-3.5 h-3.5" /> Victim Coordinates</span>
              <p className="font-mono text-slate-500 mt-1">Lat: {lat.toFixed(5)} · Lng: {lng.toFixed(5)}</p>
              <p className={`text-[10px] text-slate-400 mt-0.5`}>* Click anywhere on map to reposition safety band.</p>
            </div>
            
            <MapContainer
              center={[lat, lng]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                url={tileUrl}
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
              <MapEventsHandler onMapClick={handleMapClick} />
              
              <Marker position={[lat, lng]} icon={victimIcon}>
                <Popup>
                  <div className="text-xs">
                    <span className="font-bold">{victimName}</span>
                    <p>{victimPhone}</p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          {/* Diagnostics Log Console */}
          <div className="card border p-4 bg-black/95 text-green-400 font-mono text-xs rounded-2xl h-52 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-green-400/20 text-[10px] text-green-400/60 font-bold uppercase tracking-wider">
              <span>Smartwatch Diagnostic Console Log</span>
              <button 
                onClick={() => setLogs([])}
                className="hover:text-green-400 text-green-400/40 text-[9px] border border-green-400/20 px-2 py-0.5 rounded transition-all cursor-pointer"
              >
                Clear logs
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pt-2 space-y-1 scrollbar-thin select-all">
              {logs.length === 0 ? (
                <div className="text-green-400/40 text-center py-10">No diagnostic entries. Trigger actions to inspect console outputs.</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="leading-relaxed">{log}</div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
