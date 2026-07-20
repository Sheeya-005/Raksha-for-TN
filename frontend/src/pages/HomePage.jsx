import { ShieldCheck, HeartPulse, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function HomePage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0B0F19] text-slate-100 relative overflow-hidden select-none">
      
      {/* Background visual glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-rose-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/20">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-black text-lg tracking-wider uppercase text-white">SAFEWATCH TN</span>
            <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase -mt-1">Women Safety Network</p>
          </div>
        </div>

        {/* Live operational status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500/10 border border-green-500/20 text-green-400">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>SYSTEM ONLINE</span>
        </div>
      </header>

      {/* Hero content */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-16 text-center max-w-4xl mx-auto w-full z-10">
        
        {/* State Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-slate-800 border border-slate-700 text-slate-300 mb-6">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          Government of Tamil Nadu Safety Initiative
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
          Tamil Nadu Women Safety <br />
          <span className="bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 bg-clip-text text-transparent">
            Emergency Response Network
          </span>
        </h1>
        
        <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          Real-time emergency detection, location-based response, and coordinated safety assistance across Tamil Nadu. Connecting IoT wearable safety bands directly to law enforcement dispatch decks and volunteer responders.
        </p>

        {/* Main Secure Login Button */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-xl shadow-red-600/25 active:scale-98 transition-all cursor-pointer border border-red-500/30"
        >
          <span>Secure Portal Login</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-600 border-t border-slate-900 font-semibold uppercase tracking-wider bg-[#060810]">
        State-of-the-Art Operations Command Center — Tamil Nadu Public Security Network © 2026.
      </footer>

    </div>
  );
}
