import { Shield, ShieldAlert, Users, Radio, ArrowRight, HeartPulse } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';

export default function PortalPage() {
  const { isDark, toggleTheme } = useTheme();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const panels = [
    {
      title: 'Admin Command Panel',
      description: 'System control center. Monitor active alerts, map responders, view live metrics, and manage dispatch history.',
      icon: Shield,
      color: 'from-red-600 to-rose-500 shadow-red-500/10',
      badge: 'Control Center',
      onClick: () => navigate('/login?role=admin'),
    },
    {
      title: 'Police Officer Panel',
      description: 'For on-duty law enforcement officers. Toggle availability, track GPS coordinates, receive SOS dispatches, and get route maps.',
      icon: ShieldAlert,
      color: 'from-blue-600 to-indigo-500 shadow-blue-500/10',
      badge: 'Responder Unit',
      onClick: () => navigate('/login?role=police'),
    },
    {
      title: 'People / Volunteer Panel',
      description: 'Community network responders. Register/login, manage status, receive location coordinates, and assist in nearby emergencies.',
      icon: Users,
      color: 'from-cyan-600 to-teal-500 shadow-cyan-500/10',
      badge: 'Community Action',
      onClick: () => navigate('/login?role=volunteer'),
    },
    {
      title: 'Safety Band Simulator',
      description: 'Wearable simulation console. Place mock victims on Leaflet maps, trigger live SOS button signals, and watch automatic dispatches.',
      icon: Radio,
      color: 'from-purple-600 to-violet-500 shadow-purple-500/10',
      badge: 'Emergency SOS Simulator',
      onClick: () => navigate('/simulator'),
    }
  ];

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-300 ${isDark ? 'dark bg-slate-950 text-slate-100' : 'light bg-slate-50 text-slate-800'}`}>
      
      {/* Decorative Blur Vectors */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-wide uppercase bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">SafeWatch TN</span>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase -mt-1">Women Safety Network</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Server Connection Status */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            connected 
              ? 'bg-green-500/15 border-green-500/20 text-green-400' 
              : 'bg-yellow-500/15 border-yellow-500/20 text-yellow-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-ping'}`} />
            {connected ? 'Server Live' : 'Connecting to Server…'}
          </div>

          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/5 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-sm cursor-pointer"
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </header>

      {/* Hero Body */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-12 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Women Safety Band <br />
            <span className="bg-gradient-to-r from-red-500 via-rose-500 to-purple-500 bg-clip-text text-transparent">
              Emergency Response System
            </span>
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
            Tamil Nadu safety dispatch network. Connecting physical IoT wearable emergency triggers to first responders and community volunteers in real-time.
          </p>
        </div>

        {/* Panel Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {panels.map((p, i) => {
            const Icon = p.icon;
            return (
              <div 
                key={i} 
                onClick={p.onClick}
                className="group relative flex flex-col justify-between p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-red-500/30 hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm"
              >
                {/* Visual Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-all duration-300 pointer-events-none" />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {p.badge}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold group-hover:text-red-500 transition-colors duration-200">
                      {p.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-red-500 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 group-hover:gap-2 transition-all">
                  <span>Enter Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-200/50 dark:border-slate-800/50 font-medium">
        🛡️ State-of-the-Art Women Safety and Emergency Dispatch Network — SafeWatch Tamil Nadu © 2026.
      </footer>
    </div>
  );
}
