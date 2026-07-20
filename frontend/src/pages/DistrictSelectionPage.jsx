import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, ShieldCheck, HeartPulse } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DistrictSelector from '../components/ui/DistrictSelector';
import toast from 'react-hot-toast';

export default function DistrictSelectionPage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [district, setDistrict] = useState(null);

  const handleEnterDashboard = () => {
    if (!district) {
      toast.error('Please select a district to proceed.');
      return;
    }

    // Save selected district in user context
    updateProfile({ selectedDistrict: district.name });
    
    toast.success(`District set to ${district.name}. Entering dashboard…`);

    // Redirect based on role
    if (user?.role === 'admin') {
      navigate('/admin/dashboard');
    } else if (user?.role === 'police') {
      navigate('/police/dashboard');
    } else {
      navigate('/volunteer/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-slate-100 p-6 relative select-none">
      
      {/* Decorative vectors */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 text-center animate-fade-in">
        
        {/* Logo and title */}
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-500/10 rounded-xl border border-red-500/20 mb-2">
            <HeartPulse className="w-6 h-6 text-red-500 animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-white uppercase">SELECT YOUR DISTRICT</h2>
          <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
            Initializes map coordinates and dashboard telemetry
          </p>
        </div>

        {/* District Selector Wrapper */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-[#0E1322] space-y-6 text-left">
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Search Tamil Nadu Districts</label>
            <DistrictSelector 
              value={district ? district.name : ''} 
              onChange={setDistrict} 
            />
          </div>

          {district && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-850 text-xs text-slate-400 space-y-1">
              <div className="font-bold text-white">District Coordinates Loaded:</div>
              <div className="font-mono">Latitude: {district.lat.toFixed(4)}</div>
              <div className="font-mono">Longitude: {district.lng.toFixed(4)}</div>
            </div>
          )}

          <button
            onClick={handleEnterDashboard}
            disabled={!district}
            className={`w-full py-3 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              district 
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-95 shadow-lg active:scale-98' 
                : 'bg-slate-800 text-slate-500 border border-slate-850 cursor-not-allowed'
            }`}
          >
            <span>Enter Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
          🔒 Secure Operations Dispatch Node
        </p>

      </div>
    </div>
  );
}
