import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, MapPin, CheckCircle, ChevronRight, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

export default function PermissionsPage() {
  const { grantPermissions, user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [gpsState, setGpsState] = useState('prompt'); // prompt, active, denied
  const [loading, setLoading] = useState(false);

  const requestGps = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      setGpsState('denied');
      setLoading(false);
      toast.error('Browser does not support geolocation tracking.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsState('active');
        setLoading(false);
        toast.success('Live Geolocation Access Approved!');
        
        // Save permission and go to respective panel
        grantPermissions();
        setTimeout(() => {
          navigateDashboard();
        }, 1000);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setGpsState('denied');
        setLoading(false);
        toast.error('Location Access Denied. Please enable GPS permissions.');
      }
    );
  };

  const navigateDashboard = () => {
    if (user?.role === 'admin') navigate('/admin/dashboard');
    else if (user?.role === 'police') navigate('/police/dashboard');
    else navigate('/volunteer/dashboard');
  };

  // Auto request on page mount
  useEffect(() => {
    requestGps();
  }, []);

  const simulateGpsBypass = () => {
    toast.success('Simulation Mode: Mocking location permission approval.');
    grantPermissions();
    navigateDashboard();
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 ${isDark ? 'dark bg-slate-950 text-slate-100' : 'light bg-slate-50 text-slate-800'}`}>
      <div className="w-full max-w-md animate-fade-in text-center">
        
        {/* Header Branding */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-rose-500 rounded-2xl mb-6 shadow-lg shadow-red-500/20">
          <Shield className="w-8 h-8 text-white animate-pulse" />
        </div>
        
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
          Location Permission Required
        </h1>
        <p className={`text-xs mt-2 max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          SafeWatch TN requires active GPS live tracking to map responders and victims. Responders must allow location tracking to activate dashboard assignment.
        </p>

        {/* Permission Status Box */}
        <div className="my-8">
          {gpsState === 'prompt' && (
            <div className={`p-6 rounded-2xl border text-center space-y-4 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="w-10 h-10 bg-slate-500/10 rounded-full flex items-center justify-center mx-auto text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Requesting Geolocation Permission…</div>
              <p className="text-[10px] text-slate-500">Please click "Allow" on the browser pop-up to verify your active responder location.</p>
            </div>
          )}

          {gpsState === 'active' && (
            <div className={`p-6 rounded-2xl border text-center space-y-3 ${
              isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'
            }`}>
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-green-500">GPS Tracker Connected</div>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Live position synchronized. Entering safety dispatch dashboard…</p>
            </div>
          )}

          {gpsState === 'denied' && (
            <div className={`p-6 rounded-2xl border text-center space-y-4 ${
              isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
            }`}>
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-red-500">Location Access Denied / Blocked</div>
              <p className={`text-[10px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                SafeWatch TN cannot monitor responders without GPS access. Please click the site icon in your browser address bar and change location permissions to **Allow**.
              </p>

              <div className="flex flex-col gap-2 pt-2">
                <button 
                  onClick={requestGps}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all cursor-pointer"
                >
                  Retry GPS Request
                </button>
                <button 
                  onClick={simulateGpsBypass}
                  className={`w-full py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer ${
                    isDark ? 'border-slate-800 hover:bg-slate-900 text-slate-400' : 'border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Simulate Location Bypass (Testing fallback)
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
          🛡️ Secure SSL live location tracking network.
        </p>

      </div>
    </div>
  );
}
