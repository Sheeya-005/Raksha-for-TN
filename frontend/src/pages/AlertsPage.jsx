import { useState, useMemo } from 'react';
import { AlertTriangle, Search, Filter, Download, X, ChevronDown, Eye } from 'lucide-react';
import { MOCK_ALERTS } from '../data/mockData';
import { TN_DISTRICTS } from '../data/districts';
import { useTheme } from '../context/ThemeContext';
import { formatDate, getStatusBadge, getSeverityColor, timeAgo } from '../utils/helpers';

const ALERT_TYPES = ['SOS', 'Fall Detection', 'Panic Button', 'Low Battery', 'Offline', 'Location Update'];
const STATUSES = ['Active', 'Resolved', 'Acknowledged'];

function AlertModal({ alert, isDark, onClose }) {
  if (!alert) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`relative w-full max-w-lg rounded-2xl border shadow-2xl animate-fade-in
          ${isDark ? 'bg-dark-800 border-white/10' : 'bg-white border-slate-200'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
          <div>
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Alert Details</h3>
            <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{alert.id}</div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl ${isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'User Name', value: alert.userName },
              { label: 'User ID', value: alert.userId },
              { label: 'Watch ID', value: alert.watchId },
              { label: 'Phone', value: alert.phone },
              { label: 'District', value: alert.district },
              { label: 'Alert Type', value: alert.alertType },
              { label: 'Severity', value: alert.severity },
              { label: 'Status', value: alert.status },
              { label: 'Battery', value: `${alert.battery}%` },
              { label: 'Heart Rate', value: `${alert.heartRate} bpm` },
              { label: 'GPS Coords', value: `${alert.lat?.toFixed(4)}, ${alert.lng?.toFixed(4)}` },
              { label: 'Time', value: formatDate(alert.timestamp) },
            ].map(({ label, value }) => (
              <div key={label} className={`rounded-xl p-3 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                <div className={`text-xs mb-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</div>
                <div className={`font-medium text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{value || '—'}</div>
              </div>
            ))}
          </div>
          <div className={`rounded-xl p-3 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
            <div className={`text-xs mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Address</div>
            <div className={`text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{alert.address}</div>
          </div>
          <div className={`rounded-xl p-3 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
            <div className={`text-xs mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Description</div>
            <div className={`text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{alert.description}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const filtered = useMemo(() => {
    return MOCK_ALERTS.filter(a => {
      if (search && !`${a.userName} ${a.watchId} ${a.district} ${a.alertType}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (typeFilter !== 'all' && a.alertType !== typeFilter) return false;
      if (districtFilter !== 'all' && a.district !== districtFilter) return false;
      return true;
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [search, statusFilter, typeFilter, districtFilter]);

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const handleExport = () => {
    const csv = [
      ['ID', 'User', 'Type', 'District', 'Severity', 'Status', 'Time'].join(','),
      ...filtered.map(a => [a.id, a.userName, a.alertType, a.district, a.severity, a.status, formatDate(a.timestamp)].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'alerts.csv'; a.click();
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Alert History</h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{filtered.length} alerts total</p>
        </div>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-xs px-4 py-2">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className={`card p-4 ${isDark ? 'dark' : 'light'}`}>
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search user, ID, district…"
              className={`input pl-9 py-2 text-xs ${isDark ? 'dark' : 'light'}`}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {/* Status */}
          <select
            className={`input py-2 text-xs w-36 ${isDark ? 'bg-dark-800 border-white/10 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Statuses</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>

          {/* Type */}
          <select
            className={`input py-2 text-xs w-44 ${isDark ? 'bg-dark-800 border-white/10 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Types</option>
            {ALERT_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>

          {/* District */}
          <select
            className={`input py-2 text-xs w-44 ${isDark ? 'bg-dark-800 border-white/10 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
            value={districtFilter}
            onChange={e => { setDistrictFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Districts</option>
            {TN_DISTRICTS.map(d => <option key={d.id}>{d.name}</option>)}
          </select>

          {(search || statusFilter !== 'all' || typeFilter !== 'all' || districtFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); setDistrictFilter('all'); setPage(1); }}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs ${isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={`card overflow-hidden ${isDark ? 'dark' : 'light'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={`border-b ${isDark ? 'border-white/5 bg-white/2' : 'border-slate-100 bg-slate-50'}`}>
                {['Alert ID', 'User', 'Type', 'District', 'Severity', 'Status', 'Time', ''].map(h => (
                  <th key={h} className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/3">
              {paginated.map(a => (
                <tr
                  key={a.id}
                  className={`transition-colors ${isDark ? 'hover:bg-white/3' : 'hover:bg-slate-50'}`}
                >
                  <td className={`px-4 py-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{a.id}</td>
                  <td className="px-4 py-3">
                    <div className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{a.userName}</div>
                    <div className={`${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{a.watchId}</div>
                  </td>
                  <td className={`px-4 py-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{a.alertType}</td>
                  <td className={`px-4 py-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{a.district}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${getSeverityColor(a.severity)}`}>{a.severity}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${getStatusBadge(a.status)}`}>{a.status}</span>
                  </td>
                  <td className={`px-4 py-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{timeAgo(a.timestamp)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedAlert(a)} className="p-1.5 rounded-lg text-brand-400 hover:bg-brand-500/10 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={`flex items-center justify-between px-4 py-3 border-t text-xs ${isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
          <span>Page {page} of {totalPages} · {filtered.length} results</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className={`px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'}`}>Prev</button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className={`px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'}`}>Next</button>
          </div>
        </div>
      </div>

      {selectedAlert && <AlertModal alert={selectedAlert} isDark={isDark} onClose={() => setSelectedAlert(null)} />}
    </div>
  );
}
