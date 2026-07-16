import { useState } from 'react';
import {
  Users, Watch, AlertTriangle, CheckCircle2, WifiOff, Wifi, Radio,
  TrendingUp, TrendingDown, ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { DASHBOARD_STATS, ALERT_TREND, MOCK_ALERTS, DISTRICT_STATS } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';
import { formatDate, getStatusBadge, timeAgo } from '../utils/helpers';

const STAT_CARDS = [
  { label: 'Total Connected Users', value: DASHBOARD_STATS.totalUsers, icon: Users, color: 'from-blue-600 to-blue-500', trend: '+12%' },
  { label: 'Active Smartwatches', value: DASHBOARD_STATS.activeWatches, icon: Watch, color: 'from-purple-600 to-purple-500', trend: '+5%' },
  { label: 'Active Emergency Alerts', value: DASHBOARD_STATS.activeAlerts, icon: AlertTriangle, color: 'from-red-600 to-red-500', trend: '-8%' },
  { label: 'Resolved Alerts', value: DASHBOARD_STATS.resolvedAlerts, icon: CheckCircle2, color: 'from-green-600 to-green-500', trend: '+23%' },
  { label: 'Offline Devices', value: DASHBOARD_STATS.offlineDevices, icon: WifiOff, color: 'from-gray-600 to-gray-500', trend: '-2%' },
  { label: 'Connected Devices', value: DASHBOARD_STATS.connectedDevices, icon: Wifi, color: 'from-cyan-600 to-cyan-500', trend: '+7%' },
  { label: 'Live Tracking Active', value: DASHBOARD_STATS.liveTracking, icon: Radio, color: 'from-brand-600 to-brand-500', trend: '+15%' },
];

const PIE_DATA = [
  { name: 'SOS', value: 18, color: '#ef4444' },
  { name: 'Fall Detection', value: 12, color: '#f97316' },
  { name: 'Panic Button', value: 9, color: '#eab308' },
  { name: 'Low Battery', value: 15, color: '#3b82f6' },
  { name: 'Offline', value: 6, color: '#6b7280' },
];

const CHART_COLORS = {
  sos: '#ef4444',
  fall: '#f97316',
  panic: '#eab308',
  battery: '#3b82f6',
};

const topDistricts = [...DISTRICT_STATS].sort((a, b) => b.activeAlerts - a.activeAlerts).slice(0, 8);
const recentAlerts = [...MOCK_ALERTS].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8);

function CustomTooltip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-xl p-3 border text-xs shadow-xl ${isDark ? 'bg-dark-800 border-white/10 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}>
      <p className="font-semibold mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}: <b>{p.value}</b></span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage({ selectedDistrict }) {
  const { isDark } = useTheme();

  const grid = isDark ? '#1e293b' : '#e2e8f0';
  const axis = isDark ? '#64748b' : '#94a3b8';

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {selectedDistrict ? `${selectedDistrict} Dashboard` : 'Safety Dashboard'}
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Real-time monitoring · Tamil Nadu Safety Network
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border ${isDark ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-green-50 border-green-200 text-green-600'}`}>
          <div className="w-2 h-2 bg-green-400 rounded-full live-pulse" />
          Live · Updated just now
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map((s, i) => {
          const Icon = s.icon;
          const isPos = s.trend.startsWith('+');
          return (
            <div key={i} className={`card p-5 ${isDark ? 'dark' : 'light'} hover:scale-[1.01] transition-transform cursor-default`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`flex items-center gap-0.5 text-xs font-medium ${isPos ? 'text-green-400' : 'text-red-400'}`}>
                  {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {s.trend}
                </span>
              </div>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.value}</div>
              <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alert trend */}
        <div className={`card p-5 lg:col-span-2 ${isDark ? 'dark' : 'light'}`}>
          <h3 className={`font-semibold text-sm mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>7-Day Alert Trends</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={ALERT_TREND}>
              <defs>
                {Object.entries(CHART_COLORS).map(([k, c]) => (
                  <linearGradient key={k} id={`grad_${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="day" tick={{ fill: axis, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axis, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip isDark={isDark} />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="sos" name="SOS" stroke={CHART_COLORS.sos} fill={`url(#grad_sos)`} strokeWidth={2} />
              <Area type="monotone" dataKey="fall" name="Fall" stroke={CHART_COLORS.fall} fill={`url(#grad_fall)`} strokeWidth={2} />
              <Area type="monotone" dataKey="panic" name="Panic" stroke={CHART_COLORS.panic} fill={`url(#grad_panic)`} strokeWidth={2} />
              <Area type="monotone" dataKey="battery" name="Battery" stroke={CHART_COLORS.battery} fill={`url(#grad_battery)`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className={`card p-5 ${isDark ? 'dark' : 'light'}`}>
          <h3 className={`font-semibold text-sm mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Alert Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {PIE_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: isDark ? '#1e293b' : '#fff', border: 'none', borderRadius: 8, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {PIE_DATA.map(p => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
                  <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{p.name}</span>
                </div>
                <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* District bar chart */}
        <div className={`card p-5 ${isDark ? 'dark' : 'light'}`}>
          <h3 className={`font-semibold text-sm mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Top Districts by Active Alerts</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topDistricts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
              <XAxis type="number" tick={{ fill: axis, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: axis, fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ background: isDark ? '#1e293b' : '#fff', border: 'none', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="activeAlerts" name="Active Alerts" fill="#ef4444" radius={[0, 4, 4, 0]} />
              <Bar dataKey="connectedWatches" name="Connected" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent alerts table */}
        <div className={`card p-5 ${isDark ? 'dark' : 'light'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Recent Alerts</h3>
            <button className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-52">
            {recentAlerts.map(a => (
              <div key={a.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${isDark ? 'bg-white/3 hover:bg-white/5' : 'bg-slate-50 hover:bg-slate-100'} transition-colors`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  a.severity === 'Critical' ? 'bg-red-400' :
                  a.severity === 'High' ? 'bg-orange-400' :
                  a.severity === 'Medium' ? 'bg-yellow-400' : 'bg-blue-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{a.userName}</div>
                  <div className={`text-xs truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{a.alertType} · {a.district}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(a.status)}`}>{a.status}</span>
                  <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{timeAgo(a.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
