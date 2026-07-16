import { useState, useEffect } from 'react';
import { Watch, Wifi, WifiOff, Battery, Signal, Clock, Cpu, MapPin, Activity, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../utils/helpers';

function CircularProgress({ value, max = 100, color, label, size = 80 }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = ((max - value) / max) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="text-center -mt-14">
        <div className="font-bold text-lg" style={{ color }}>{value}{max === 100 ? '%' : ''}</div>
      </div>
      <div className="text-xs text-slate-400 mt-6">{label}</div>
    </div>
  );
}

function SignalBars({ strength, color }) {
  return (
    <div className="flex items-end gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className="w-3 rounded-sm transition-all"
          style={{
            height: `${i * 5 + 4}px`,
            background: i <= strength ? color : 'rgba(255,255,255,0.1)',
          }}
        />
      ))}
    </div>
  );
}

export default function SmartwatchPage() {
  const { isDark } = useTheme();
  const { connected } = useSocket();
  const { user } = useAuth();
  const [battery, setBattery] = useState(78);
  const [heartRate, setHeartRate] = useState(72);
  const [signal, setSignal] = useState(4);
  const [lastSync, setLastSync] = useState(new Date().toISOString());
  const [dataLog, setDataLog] = useState([]);

  // Simulate live data
  useEffect(() => {
    const interval = setInterval(() => {
      const newHr = Math.max(55, Math.min(120, heartRate + Math.floor(Math.random() * 7 - 3)));
      setHeartRate(newHr);
      setLastSync(new Date().toISOString());
      setDataLog(prev => [{
        time: new Date().toLocaleTimeString('en-IN'),
        type: 'GPS Update',
        data: `HR: ${newHr} bpm · GPS: active · Batt: ${battery}%`,
      }, ...prev].slice(0, 8));
    }, 8000);
    return () => clearInterval(interval);
  }, [heartRate, battery]);

  const STATUS_ITEMS = [
    { icon: Wifi, label: 'Connection Status', value: connected ? 'Connected' : 'Disconnected', color: connected ? 'text-green-400' : 'text-red-400' },
    { icon: MapPin, label: 'GPS Status', value: 'Active · High Accuracy', color: 'text-blue-400' },
    { icon: Cpu, label: 'Firmware Version', value: 'v2.4.1 (Latest)', color: isDark ? 'text-slate-300' : 'text-slate-700' },
    { icon: Activity, label: 'Device Health', value: 'Excellent', color: 'text-green-400' },
    { icon: Clock, label: 'Last Sync', value: timeAgo(lastSync), color: isDark ? 'text-slate-300' : 'text-slate-700' },
    { icon: Watch, label: 'Device ID', value: user?.watchId || 'SW1001', color: isDark ? 'text-slate-300' : 'text-slate-700' },
  ];

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Smartwatch Status</h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Real-time device monitoring</p>
        </div>
        <button className="btn-secondary flex items-center gap-2 text-xs px-4 py-2">
          <RefreshCw className="w-3.5 h-3.5" /> Sync Now
        </button>
      </div>

      {/* Connection banner */}
      <div className={`card p-4 flex items-center gap-4 ${isDark ? 'dark' : 'light'} ${
        connected
          ? isDark ? 'ring-1 ring-green-500/30' : 'ring-1 ring-green-400/30'
          : isDark ? 'ring-1 ring-red-500/30' : 'ring-1 ring-red-400/30'
      }`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
          connected ? 'bg-green-500/10' : 'bg-red-500/10'
        }`}>
          {connected
            ? <Wifi className="w-8 h-8 text-green-400" />
            : <WifiOff className="w-8 h-8 text-red-400" />
          }
        </div>
        <div className="flex-1">
          <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {connected ? 'Smartwatch Connected' : 'Smartwatch Offline'}
          </div>
          <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {connected ? `Device ID: ${user?.watchId || 'SW1001'} · Live data streaming` : 'Last seen 5 minutes ago'}
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium ${
          connected
            ? isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'
            : isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
        }`}>
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 live-pulse' : 'bg-red-400'}`} />
          {connected ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Battery */}
        <div className={`card p-6 flex flex-col items-center ${isDark ? 'dark' : 'light'}`}>
          <CircularProgress
            value={battery}
            color={battery > 50 ? '#22c55e' : battery > 20 ? '#f97316' : '#ef4444'}
            label="Battery"
            size={100}
          />
          <div className={`mt-3 text-xs flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <Battery className="w-3.5 h-3.5" />
            Est. {Math.round(battery * 0.36)}h remaining
          </div>
        </div>

        {/* Heart Rate */}
        <div className={`card p-6 flex flex-col items-center ${isDark ? 'dark' : 'light'}`}>
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400 live-pulse">{heartRate}</div>
                <div className="text-xs text-red-400/70">bpm</div>
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400">Heart Rate</div>
          <div className={`mt-1 text-xs ${heartRate < 60 ? 'text-blue-400' : heartRate > 100 ? 'text-red-400' : 'text-green-400'}`}>
            {heartRate < 60 ? 'Low' : heartRate > 100 ? 'High' : 'Normal'}
          </div>
        </div>

        {/* Signal */}
        <div className={`card p-6 flex flex-col items-center justify-center gap-3 ${isDark ? 'dark' : 'light'}`}>
          <SignalBars strength={signal} color="#3b82f6" />
          <div className="text-center">
            <div className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Signal Strength</div>
            <div className="text-blue-400 text-sm">{['', 'Very Weak', 'Weak', 'Fair', 'Good', 'Excellent'][signal]}</div>
          </div>
        </div>
      </div>

      {/* Status table */}
      <div className={`card p-5 ${isDark ? 'dark' : 'light'}`}>
        <h3 className={`font-semibold text-sm mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Device Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {STATUS_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/3' : 'bg-slate-50'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                  <Icon className="w-4 h-4 text-brand-400" />
                </div>
                <div>
                  <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</div>
                  <div className={`text-sm font-medium ${item.color}`}>{item.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data stream log */}
      <div className={`card p-5 ${isDark ? 'dark' : 'light'}`}>
        <div className="flex items-center gap-2 mb-4">
          <h3 className={`font-semibold text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Live Data Stream</h3>
          <div className="w-2 h-2 bg-green-400 rounded-full live-pulse" />
        </div>
        {dataLog.length === 0 ? (
          <div className={`text-center py-6 text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            Waiting for data…
          </div>
        ) : (
          <div className="space-y-2">
            {dataLog.map((log, i) => (
              <div key={i} className={`flex items-start gap-3 p-2.5 rounded-xl text-xs ${isDark ? 'bg-white/3' : 'bg-slate-50'}`}>
                <span className={`flex-shrink-0 font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{log.time}</span>
                <span className="text-brand-400 font-medium flex-shrink-0">{log.type}</span>
                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{log.data}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
