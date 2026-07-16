import { useState } from 'react';
import { MapPin, AlertTriangle, CheckCircle2, Watch, Clock, ChevronRight, Search } from 'lucide-react';
import { DISTRICT_STATS } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';
import { timeAgo } from '../utils/helpers';

function DistrictCard({ d, isDark, onClick }) {
  return (
    <div
      onClick={() => onClick(d)}
      className={`card p-5 cursor-pointer hover:scale-[1.02] transition-all duration-200 group ${isDark ? 'dark' : 'light'}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{d.name}</h3>
          <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {d.area?.toLocaleString()} km²
          </div>
        </div>
        <div className={`p-2 rounded-xl ${isDark ? 'bg-white/5 group-hover:bg-brand-500/10' : 'bg-slate-50 group-hover:bg-brand-50'} transition-colors`}>
          <MapPin className="w-4 h-4 text-brand-400" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className={`rounded-xl p-2.5 ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 mb-1" />
          <div className="text-red-400 font-bold text-lg">{d.activeAlerts}</div>
          <div className={`text-xs ${isDark ? 'text-red-400/60' : 'text-red-400/80'}`}>Active</div>
        </div>
        <div className={`rounded-xl p-2.5 ${isDark ? 'bg-green-500/10' : 'bg-green-50'}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mb-1" />
          <div className="text-green-400 font-bold text-lg">{d.resolvedAlerts}</div>
          <div className={`text-xs ${isDark ? 'text-green-400/60' : 'text-green-400/80'}`}>Resolved</div>
        </div>
        <div className={`rounded-xl p-2.5 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
          <Watch className="w-3.5 h-3.5 text-blue-400 mb-1" />
          <div className="text-blue-400 font-bold text-lg">{d.connectedWatches}</div>
          <div className={`text-xs ${isDark ? 'text-blue-400/60' : 'text-blue-400/80'}`}>Watches</div>
        </div>
        <div className={`rounded-xl p-2.5 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
          <Clock className={`w-3.5 h-3.5 mb-1 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
          <div className={`font-bold text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{d.alerts}</div>
          <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Total</div>
        </div>
      </div>

      <div className={`mt-3 flex items-center justify-between text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
        <span>Updated {timeAgo(d.lastUpdated)}</span>
        <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}

export default function DistrictsPage({ onDistrictChange }) {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('activeAlerts');

  const filtered = DISTRICT_STATS
    .filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const handleCardClick = (d) => {
    onDistrictChange(d);
  };

  const totals = {
    alerts: DISTRICT_STATS.reduce((s, d) => s + d.alerts, 0),
    active: DISTRICT_STATS.reduce((s, d) => s + d.activeAlerts, 0),
    resolved: DISTRICT_STATS.reduce((s, d) => s + d.resolvedAlerts, 0),
    watches: DISTRICT_STATS.reduce((s, d) => s + d.connectedWatches, 0),
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>District Monitoring</h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>All 38 Tamil Nadu Districts · Click to view on map</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search district…"
              className={`input pl-9 py-2 text-xs w-44 ${isDark ? 'dark' : 'light'}`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className={`input py-2 text-xs w-40 ${isDark ? 'bg-dark-800 border-white/10 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="activeAlerts">By Active Alerts</option>
            <option value="alerts">By Total Alerts</option>
            <option value="connectedWatches">By Watches</option>
          </select>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Alerts', value: totals.alerts, color: 'text-slate-400' },
          { label: 'Active Alerts', value: totals.active, color: 'text-red-400' },
          { label: 'Resolved', value: totals.resolved, color: 'text-green-400' },
          { label: 'Connected Watches', value: totals.watches, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className={`card p-4 text-center ${isDark ? 'dark' : 'light'}`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* District grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(d => (
          <DistrictCard key={d.id} d={d} isDark={isDark} onClick={handleCardClick} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className={`card p-12 text-center ${isDark ? 'dark' : 'light'}`}>
          <MapPin className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          <p className={isDark ? 'text-slate-500' : 'text-slate-400'}>No districts match "{search}"</p>
        </div>
      )}
    </div>
  );
}
