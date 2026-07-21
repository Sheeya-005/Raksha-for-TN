import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Shield, Lock, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error('Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      // Force role is admin
      const res = await login(form.email, form.password, 'admin');
      if (res.success) {
        toast.success('Welcome to SafeWatch Admin Operations Deck');
        navigate('/select-district');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070A13] text-slate-100 p-6 select-none relative">
      
      {/* Background design elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-red-600/10 rounded-2xl border border-red-500/20 mb-2">
            <Shield className="w-7 h-7 text-red-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black tracking-wider text-white uppercase">ADMIN COMMAND LOG IN</h2>
          <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Tamil Nadu State Dispatch HQ Control Deck</p>
        </div>

        <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-900 backdrop-blur-sm space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email */}
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider mb-1.5 text-slate-400">Admin Username / Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="admin or admin@safetytamil.in"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-800 bg-[#0E1322] focus:outline-none focus:ring-2 focus:ring-red-500/30 text-white"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider mb-1.5 text-slate-400">Security Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-800 bg-[#0E1322] focus:outline-none focus:ring-2 focus:ring-red-500/30 text-white"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-95 shadow-lg active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying HQ Credentials…
                </>
              ) : (
                'Access Dispatch Network'
              )}
            </button>
          </form>

          <div className="text-center py-1 border-t border-slate-850 pt-4 space-y-1.5">
            <button
              type="button"
              onClick={() => setForm({ email: 'admin', password: 'admin@123' })}
              className="w-full mb-3 py-2 border border-red-500/20 hover:border-red-500/40 rounded-xl text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-white bg-red-950/5 hover:bg-red-950/10 transition-all cursor-pointer text-center"
            >
              Autofill Seeded Admin Demo
            </button>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">New operational officer?</p>
            <Link to="/admin/register" className="text-red-400 hover:underline font-bold text-xs">Register New Admin Profile</Link>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-1.5 py-3 border border-slate-900 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-900/60 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home Page
        </button>
      </div>
    </div>
  );
}
