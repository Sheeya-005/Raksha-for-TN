import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, AlertTriangle, Battery, WifiOff, MapPin, Activity } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { MOCK_NOTIFICATIONS } from '../../data/mockData';
import { useTheme } from '../../context/ThemeContext';
import { timeAgo } from '../../utils/helpers';

const TYPE_ICONS = {
  'SOS': { icon: AlertTriangle, color: 'text-red-400 bg-red-500/10' },
  'Fall Detection': { icon: Activity, color: 'text-orange-400 bg-orange-500/10' },
  'Panic Button': { icon: AlertTriangle, color: 'text-red-400 bg-red-500/10' },
  'Low Battery': { icon: Battery, color: 'text-yellow-400 bg-yellow-500/10' },
  'Offline': { icon: WifiOff, color: 'text-gray-400 bg-gray-500/10' },
  'Location Update': { icon: MapPin, color: 'text-blue-400 bg-blue-500/10' },
};

export default function NotificationBell({ count }) {
  const { isDark } = useTheme();
  const { markAllRead, liveAlerts } = useSocket();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const [notifs, setNotifs] = useState(MOCK_NOTIFICATIONS.slice(0, 12));

  useEffect(() => {
    if (liveAlerts.length) {
      setNotifs(prev => [
        {
          id: `live_${Date.now()}`,
          userName: liveAlerts[0].userName,
          alertType: liveAlerts[0].alertType,
          district: liveAlerts[0].district,
          lat: liveAlerts[0].lat,
          lng: liveAlerts[0].lng,
          status: 'Active',
          severity: liveAlerts[0].severity,
          timestamp: liveAlerts[0].timestamp,
          read: false,
        },
        ...prev,
      ].slice(0, 20));
    }
  }, [liveAlerts]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleMarkAll = () => {
    markAllRead();
    setNotifs(n => n.map(x => ({ ...x, read: true })));
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-xl transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold animate-bounce-slow">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute right-0 top-full mt-2 w-80 rounded-2xl border shadow-2xl z-50 overflow-hidden animate-fade-in
          ${isDark ? 'bg-dark-800 border-white/10' : 'bg-white border-slate-200'}`}>
          <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
            <span className={`font-semibold text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Notifications</span>
            <div className="flex items-center gap-2">
              <button onClick={handleMarkAll} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                <Check className="w-3 h-3" /> All read
              </button>
              <button onClick={() => setOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifs.map(n => {
              const cfg = TYPE_ICONS[n.alertType] || TYPE_ICONS['SOS'];
              const Icon = cfg.icon;
              return (
                <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-b transition-colors
                  ${isDark ? 'border-white/5 hover:bg-white/3' : 'border-slate-50 hover:bg-slate-50'}
                  ${!n.read ? isDark ? 'bg-brand-500/5' : 'bg-brand-50/50' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{n.userName}</span>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{n.alertType} · {n.district}</div>
                    <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{timeAgo(n.timestamp)}</div>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                    n.severity === 'Critical' ? 'bg-red-500/15 text-red-400' :
                    n.severity === 'High' ? 'bg-orange-500/15 text-orange-400' :
                    'bg-yellow-500/15 text-yellow-400'
                  }`}>{n.severity || 'Info'}</span>
                </div>
              );
            })}
          </div>

          <div className={`px-4 py-2 ${isDark ? 'bg-dark-900/50' : 'bg-slate-50'}`}>
            <button className="w-full text-xs text-brand-400 hover:text-brand-300 text-center py-1">View all notifications →</button>
          </div>
        </div>
      )}
    </div>
  );
}
