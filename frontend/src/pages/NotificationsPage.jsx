import { useState } from 'react';
import { Bell, AlertTriangle, Activity, Battery, WifiOff, MapPin, Check, CheckCheck, Filter } from 'lucide-react';
import { MOCK_NOTIFICATIONS } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';
import { timeAgo, getSeverityColor, getStatusBadge } from '../utils/helpers';
import { useSocket } from '../context/SocketContext';

const TYPE_CONFIG = {
  'SOS': { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  'Fall Detection': { icon: Activity, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  'Panic Button': { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  'Low Battery': { icon: Battery, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  'Offline': { icon: WifiOff, color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' },
  'Location Update': { icon: MapPin, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
};

const FILTERS = ['All', 'SOS', 'Fall Detection', 'Panic Button', 'Low Battery', 'Offline', 'Location Update'];

export default function NotificationsPage() {
  const { isDark } = useTheme();
  const { liveAlerts, markAllRead } = useSocket();
  const [filter, setFilter] = useState('All');
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const allNotifs = [
    ...liveAlerts.map(a => ({
      id: `live_${a.id}`,
      userName: a.userName,
      alertType: a.alertType,
      district: a.district,
      lat: a.lat,
      lng: a.lng,
      status: 'Active',
      severity: a.severity,
      timestamp: a.timestamp,
      read: false,
    })),
    ...notifications,
  ];

  const filtered = filter === 'All' ? allNotifs : allNotifs.filter(n => n.alertType === filter);

  const handleMarkAll = () => {
    markAllRead();
    setNotifications(n => n.map(x => ({ ...x, read: true })));
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Notifications</h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {allNotifs.filter(n => !n.read).length} unread · {allNotifs.length} total
          </p>
        </div>
        <button onClick={handleMarkAll} className="btn-secondary text-xs flex items-center gap-2 px-4 py-2">
          <CheckCheck className="w-3.5 h-3.5" /> Mark all read
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-brand-600 text-white'
                : isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Live indicator */}
      {liveAlerts.length > 0 && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs ${isDark ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-200 text-red-600'}`}>
          <div className="w-2 h-2 bg-red-400 rounded-full live-pulse" />
          {liveAlerts.length} new live alert{liveAlerts.length > 1 ? 's' : ''} received
        </div>
      )}

      {/* Notifications list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className={`card p-12 text-center ${isDark ? 'dark' : 'light'}`}>
            <Bell className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            <p className={isDark ? 'text-slate-500' : 'text-slate-400'}>No notifications found</p>
          </div>
        ) : (
          filtered.map((n, i) => {
            const cfg = TYPE_CONFIG[n.alertType] || TYPE_CONFIG['SOS'];
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                className={`card p-4 flex items-start gap-4 cursor-pointer transition-all duration-200 hover:scale-[1.005] animate-fade-in ${isDark ? 'dark' : 'light'}
                  ${!n.read ? isDark ? 'ring-1 ring-brand-500/20' : 'ring-1 ring-brand-400/30' : ''}`}
                style={{ animationDelay: `${i * 20}ms` }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.bg}`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{n.userName}</span>
                        {!n.read && <div className="w-2 h-2 bg-brand-500 rounded-full" />}
                      </div>
                      <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span className="font-medium">{n.alertType}</span> · {n.district}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`badge ${getSeverityColor(n.severity)} text-xs`}>{n.severity || 'Info'}</span>
                      <span className={`badge ${getStatusBadge(n.status)} text-xs`}>{n.status}</span>
                    </div>
                  </div>

                  <div className={`flex flex-wrap items-center gap-3 mt-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{n.lat?.toFixed(3)}, {n.lng?.toFixed(3)}</span>
                    <span>{timeAgo(n.timestamp)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
