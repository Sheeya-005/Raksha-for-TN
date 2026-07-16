import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MOCK_USERS, MOCK_ALERTS, DISTRICT_STATS } from '../data/mockData';
import { TN_CENTER, TN_ZOOM, DISTRICT_ZOOM, TN_DISTRICTS } from '../data/districts';
import { useTheme } from '../context/ThemeContext';
import { formatDate, getMarkerColor, getStatusBadge, timeAgo } from '../utils/helpers';
import { Battery, Heart, Clock, MapPin, Phone, User, Watch, Wifi, WifiOff, AlertTriangle, X } from 'lucide-react';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function createCustomIcon(type, size = 14) {
  const color = getMarkerColor(type);
  const pulse = type === 'critical' || type === 'assistance';
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:2.5px solid white;
      border-radius:50%;
      box-shadow:0 2px 8px ${color}60;
      ${pulse ? `animation:livePulse 1.5s ease-in-out infinite;` : ''}
    "></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
}

function MapController({ selectedDistrict }) {
  const map = useMap();
  useEffect(() => {
    if (selectedDistrict) {
      const d = TN_DISTRICTS.find(x => x.name === selectedDistrict);
      if (d) map.flyTo([d.lat, d.lng], DISTRICT_ZOOM, { duration: 1.2 });
    } else {
      map.flyTo([TN_CENTER.lat, TN_CENTER.lng], TN_ZOOM, { duration: 1 });
    }
  }, [selectedDistrict, map]);
  return null;
}

function DistrictPanel({ district, isDark, onClose }) {
  const stats = DISTRICT_STATS.find(d => d.name === district);
  if (!stats) return null;
  return (
    <div className={`absolute top-4 right-4 z-[1000] w-64 rounded-2xl border shadow-2xl animate-fade-in
      ${isDark ? 'bg-dark-800/95 border-white/10 text-slate-200' : 'bg-white/95 border-slate-200 text-slate-800'}`}>
      <div className="flex items-center justify-between p-4 border-b border-inherit">
        <div>
          <div className="font-bold text-sm">{district}</div>
          <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>District Statistics</div>
        </div>
        <button onClick={onClose} className={`p-1 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        {[
          { label: 'Total Alerts', value: stats.alerts, color: 'text-slate-400' },
          { label: 'Active Alerts', value: stats.activeAlerts, color: 'text-red-400' },
          { label: 'Resolved Alerts', value: stats.resolvedAlerts, color: 'text-green-400' },
          { label: 'Connected Watches', value: stats.connectedWatches, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="flex items-center justify-between">
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</span>
            <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
        <div className={`text-xs pt-2 border-t ${isDark ? 'border-white/5 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
          Updated {timeAgo(stats.lastUpdated)}
        </div>
      </div>
    </div>
  );
}

const MARKER_LEGEND = [
  { type: 'critical', label: 'Critical Emergency' },
  { type: 'assistance', label: 'Assistance Required' },
  { type: 'safe', label: 'Safe' },
  { type: 'connected', label: 'Connected Device' },
  { type: 'offline', label: 'Offline Device' },
];

export default function MapPage({ selectedDistrict, onDistrictChange }) {
  const { isDark } = useTheme();
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredUsers = selectedDistrict
    ? MOCK_USERS.filter(u => u.district === selectedDistrict)
    : MOCK_USERS;

  const displayUsers = activeFilter === 'all'
    ? filteredUsers
    : filteredUsers.filter(u => u.markerType === activeFilter);

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="relative h-full flex flex-col">
      {/* Filter bar */}
      <div className={`flex items-center gap-2 px-4 py-2 border-b flex-shrink-0 overflow-x-auto
        ${isDark ? 'bg-dark-900 border-white/5' : 'bg-white border-slate-200'}`}>
        <span className={`text-xs font-medium flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Filter:</span>
        {['all', ...MARKER_LEGEND.map(m => m.type)].map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 transition-colors ${
              activeFilter === f
                ? 'bg-brand-600 text-white'
                : isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f !== 'all' && (
              <div className="w-2 h-2 rounded-full" style={{ background: getMarkerColor(f) }} />
            )}
            {f === 'all' ? 'All' : MARKER_LEGEND.find(m => m.type === f)?.label}
          </button>
        ))}
        <div className="ml-auto flex-shrink-0">
          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Showing {displayUsers.length} of {MOCK_USERS.length} users
            {selectedDistrict && ` in ${selectedDistrict}`}
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[TN_CENTER.lat, TN_CENTER.lng]}
          zoom={TN_ZOOM}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <ZoomControl position="bottomright" />
          <TileLayer
            url={tileUrl}
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          <MapController selectedDistrict={selectedDistrict} />

          {displayUsers.map(user => (
            <Marker
              key={user.id}
              position={[user.lat, user.lng]}
              icon={createCustomIcon(user.markerType)}
            >
              <Popup minWidth={260} maxWidth={300}>
                <div className={`p-4 text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold">{user.name}</div>
                      <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user.id} · {user.watchId}</div>
                      <div className={`inline-flex items-center gap-1 text-xs mt-1 px-2 py-0.5 rounded-full ${
                        user.markerType === 'critical' ? 'bg-red-100 text-red-600' :
                        user.markerType === 'assistance' ? 'bg-orange-100 text-orange-600' :
                        user.markerType === 'safe' ? 'bg-green-100 text-green-600' :
                        user.markerType === 'connected' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: getMarkerColor(user.markerType) }} />
                        {user.markerType.charAt(0).toUpperCase() + user.markerType.slice(1)}
                      </div>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="space-y-1.5 text-xs">
                    {[
                      { icon: Phone, label: user.phone },
                      { icon: MapPin, label: `${user.lat.toFixed(4)}, ${user.lng.toFixed(4)}` },
                      { icon: MapPin, label: user.address },
                      { icon: Battery, label: `Battery: ${user.battery}%` },
                      { icon: Heart, label: `Heart Rate: ${user.heartRate} bpm` },
                      { icon: Watch, label: `Watch: ${user.watchId}` },
                      { icon: Clock, label: `Updated: ${timeAgo(user.lastUpdated)}` },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div key={i} className={`flex items-start gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-brand-400" />
                          <span>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className={`absolute bottom-6 left-4 z-[1000] rounded-xl border p-3 text-xs space-y-1.5 shadow-xl
          ${isDark ? 'bg-dark-800/90 border-white/10 text-slate-300' : 'bg-white/90 border-slate-200 text-slate-600'}`}>
          {MARKER_LEGEND.map(m => (
            <div key={m.type} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-white/50" style={{ background: getMarkerColor(m.type) }} />
              {m.label}
            </div>
          ))}
        </div>

        {/* District stats panel */}
        {selectedDistrict && (
          <DistrictPanel
            district={selectedDistrict}
            isDark={isDark}
            onClose={() => onDistrictChange(null)}
          />
        )}
      </div>
    </div>
  );
}
