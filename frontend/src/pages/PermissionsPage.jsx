import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Bell, MapPin, Users, Camera, Mic, CheckCircle, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const PERMISSIONS = [
  {
    id: 'notifications',
    icon: Bell,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    title: 'Notifications',
    subtitle: 'Required',
    description: 'Receive instant SOS, fall detection, and emergency alerts from connected smartwatches. Critical for emergency response.',
  },
  {
    id: 'location',
    icon: MapPin,
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    title: 'Location',
    subtitle: 'Required',
    description: 'Enable precise GPS tracking for emergency dispatch. Your location is used only during active emergencies.',
  },
  {
    id: 'contacts',
    icon: Users,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    title: 'Contacts',
    subtitle: 'Required',
    description: 'Access emergency contacts to automatically notify them when an alert is triggered from your smartwatch.',
  },
  {
    id: 'camera',
    icon: Camera,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    title: 'Camera',
    subtitle: 'Optional',
    description: 'Used for profile photo and optional incident photo capture during emergency situations.',
  },
  {
    id: 'microphone',
    icon: Mic,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    title: 'Microphone',
    subtitle: 'Optional',
    description: 'Enables two-way audio communication with emergency responders during active SOS alerts.',
  },
];

export default function PermissionsPage() {
  const { grantPermissions, user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [granted, setGranted] = useState({});
  const [loading, setLoading] = useState(false);

  const toggle = (id) => setGranted(g => ({ ...g, [id]: !g[id] }));

  const handleContinue = async () => {
    const required = ['notifications', 'location', 'contacts'];
    const missing = required.filter(id => !granted[id]);
    if (missing.length) {
      toast.error('Please grant required permissions to continue');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    grantPermissions();
    toast.success('Permissions granted! Loading dashboard…');
    navigate('/dashboard');
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? 'dark bg-dark-950' : 'light bg-slate-50'}`}>
      <div className="w-full max-w-lg animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-600 to-brand-500 rounded-2xl mb-4 shadow-lg shadow-brand-500/20">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Welcome, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className={`text-sm mt-2 max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            SafeWatch TN needs a few permissions to provide real-time safety monitoring and emergency response.
          </p>
        </div>

        {/* Permissions list */}
        <div className="space-y-3 mb-6">
          {PERMISSIONS.map(p => {
            const Icon = p.icon;
            const isGranted = granted[p.id];
            return (
              <div
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`card p-4 cursor-pointer transition-all duration-200 ${isDark ? 'dark' : 'light'}
                  ${isGranted ? 'ring-2 ring-brand-500/40' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${p.bg}`}>
                    <Icon className={`w-5 h-5 ${p.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{p.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.subtitle === 'Required'
                          ? 'bg-red-500/15 text-red-400'
                          : isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-500'
                      }`}>{p.subtitle}</span>
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{p.description}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    isGranted ? 'bg-brand-500' : isDark ? 'bg-white/10' : 'bg-slate-200'
                  }`}>
                    {isGranted && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={handleContinue} disabled={loading} className="btn-primary w-full py-3 text-base">
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading Dashboard…</>
            : <><span>Continue to Dashboard</span><ChevronRight className="w-4 h-4" /></>
          }
        </button>

        <p className={`text-xs text-center mt-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          You can change these permissions later in Settings.
        </p>
      </div>
    </div>
  );
}
