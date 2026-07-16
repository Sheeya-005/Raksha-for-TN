import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, MapPin } from 'lucide-react';
import { TN_DISTRICTS } from '../../data/districts';
import { useTheme } from '../../context/ThemeContext';

export default function DistrictSelector({ value, onChange }) {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = TN_DISTRICTS.filter(d => d.name.toLowerCase().includes(query.toLowerCase()));
  const selected = TN_DISTRICTS.find(d => d.name === value);

  const handleSelect = (district) => {
    onChange(district);
    setOpen(false);
    setQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm border transition-colors
          ${isDark
            ? 'bg-dark-800 border-white/10 text-slate-300 hover:border-brand-500/50'
            : 'bg-white border-slate-200 text-slate-700 hover:border-brand-400'
          }`}
      >
        <MapPin className="w-4 h-4 text-brand-400 flex-shrink-0" />
        <span className="flex-1 text-left truncate">
          {selected ? selected.name : 'Select District'}
        </span>
        {selected
          ? <X className="w-3 h-3 text-slate-400 hover:text-slate-200" onClick={handleClear} />
          : <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''} text-slate-400`} />
        }
      </button>

      {open && (
        <div className={`absolute top-full left-0 mt-1 w-64 rounded-xl border shadow-2xl z-50 overflow-hidden animate-fade-in
          ${isDark ? 'bg-dark-800 border-white/10' : 'bg-white border-slate-200'}`}>
          {/* Search */}
          <div className={`flex items-center gap-2 px-3 py-2 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search district..."
              className={`flex-1 bg-transparent text-sm outline-none ${isDark ? 'text-slate-200 placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'}`}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && <button onClick={() => setQuery('')}><X className="w-3 h-3 text-slate-400" /></button>}
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className={`px-4 py-6 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No districts found</div>
            ) : (
              filtered.map(d => (
                <button
                  key={d.id}
                  onClick={() => handleSelect(d)}
                  className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm text-left transition-colors
                    ${value === d.name
                      ? isDark ? 'bg-brand-500/15 text-brand-400' : 'bg-brand-50 text-brand-600'
                      : isDark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                  {d.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
