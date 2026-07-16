import { useState } from 'react';
import { Shield, Users, Watch, AlertTriangle, BarChart3, Download, Pencil, Ban, CheckCircle2, Search, Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { MOCK_USERS, MOCK_ALERTS, DASHBOARD_STATS, DISTRICT_STATS } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, getStatusBadge, timeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';

const topDistricts = [...DISTRICT_STATS].sort((a, b) => b.alerts - a.alerts).slice(0, 10);

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const { isDark } = useTheme();
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState(MOCK_USERS);

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const filteredUsers = users.filter(u =>
    `${u.name} ${u.id} ${u.watchId} ${u.district}`.toLowerCase().includes(search.toLowerCase())
  );

  const ADMIN_STATS = [
    { label: 'Total Users', value: DASHBOARD_STATS.totalUsers, icon: Users, color: 'from-blue-600 to-blue-500' },
    { label: 'Connected Devices', value: DASHBOARD_STATS.connectedDevices, icon: Watch, color: 'from-purple-600 to-purple-500' },
    { label: 'Active Alerts', value: DASHBOARD_STATS.activeAlerts, icon: AlertTriangle, color: 'from-red-600 to-red-500' },
    { label: 'Resolved Today', value: DASHBOARD_STATS.resolvedAlerts, icon: CheckCircle2, color: 'from-green-600 to-green-500' },
  ];

  const TABS = ['overview', 'users', 'devices', 'reports'];

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Admin Panel</h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>System administration & analytics</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-xl w-fit border ${isDark ? 'bg-dark-800 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
              tab === t
                ? isDark ? 'bg-dark-700 text-white shadow' : 'bg-white text-slate-800 shadow'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {ADMIN_STATS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className={`card p-5 ${isDark ? 'dark' : 'light'}`}>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.value}</div>
                  <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</div>
                </div>
              );
            })}
          </div>

          {/* District analytics chart */}
          <div className={`card p-5 ${isDark ? 'dark' : 'light'}`}>
            <h3 className={`font-semibold text-sm mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>District-wise Alert Analytics</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topDistricts}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="name" tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: isDark ? '#1e293b' : '#fff', border: 'none', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="activeAlerts" name="Active Alerts" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolvedAlerts" name="Resolved" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="connectedWatches" name="Watches" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent critical alerts */}
          <div className={`card p-5 ${isDark ? 'dark' : 'light'}`}>
            <h3 className={`font-semibold text-sm mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Live Emergency Feed</h3>
            <div className="space-y-2">
              {MOCK_ALERTS.filter(a => a.status === 'Active').slice(0, 6).map(a => (
                <div key={a.id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-red-500/5 border border-red-500/10' : 'bg-red-50 border border-red-100'}`}>
                  <div className="w-2 h-2 bg-red-400 rounded-full live-pulse flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{a.userName}</span>
                    <span className={`text-xs ml-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{a.alertType} · {a.district}</span>
                  </div>
                  <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{timeAgo(a.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users tab */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder="Search users…"
                className={`input pl-9 py-2 text-xs ${isDark ? 'dark' : 'light'}`}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className={`card overflow-hidden ${isDark ? 'dark' : 'light'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-white/5 bg-white/2' : 'border-slate-100 bg-slate-50'}`}>
                    {['User', 'ID', 'District', 'Watch ID', 'Status', 'Battery', 'Actions'].map(h => (
                      <th key={h} className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} className={`border-b transition-colors ${isDark ? 'border-white/3 hover:bg-white/3' : 'border-slate-50 hover:bg-slate-50'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold">
                            {u.name.charAt(0)}
                          </div>
                          <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{u.name}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{u.id}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{u.district}</td>
                      <td className={`px-4 py-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{u.watchId}</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${u.status === 'Online' ? 'bg-green-500/15 text-green-400 border-green-500/20' : 'bg-gray-500/15 text-gray-400 border-gray-500/20'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${u.battery}%`, background: u.battery > 50 ? '#22c55e' : u.battery > 20 ? '#f97316' : '#ef4444' }} />
                          </div>
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{u.battery}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button className="p-1 rounded text-brand-400 hover:bg-brand-500/10 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => toast.success(`User ${u.name} action processed`)} className="p-1 rounded text-red-400 hover:bg-red-500/10 transition-colors">
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Devices tab */}
      {tab === 'devices' && (
        <div className={`card p-5 ${isDark ? 'dark' : 'light'}`}>
          <h3 className={`font-semibold text-sm mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Connected Smartwatches</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MOCK_USERS.slice(0, 12).map(u => (
              <div key={u.id} className={`p-3 rounded-xl border ${isDark ? 'bg-white/3 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-mono text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{u.watchId}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === 'Online' ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-400'}`}>
                    {u.status}
                  </span>
                </div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{u.name}</div>
                <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{u.district}</div>
                <div className="flex items-center gap-1 mt-2">
                  <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full" style={{ width: `${u.battery}%`, background: u.battery > 50 ? '#22c55e' : '#f97316' }} />
                  </div>
                  <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{u.battery}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports tab */}
      {tab === 'reports' && (
        <div className="space-y-4">
          <div className={`card p-5 ${isDark ? 'dark' : 'light'}`}>
            <h3 className={`font-semibold text-sm mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Generate Reports</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Alert Summary Report', 'District Statistics', 'Device Health Report', 'User Activity Log'].map(r => (
                <div key={r} className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-white/3 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-brand-400" />
                    <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{r}</span>
                  </div>
                  <button onClick={() => toast.success(`Generating ${r}…`)} className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors">
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
