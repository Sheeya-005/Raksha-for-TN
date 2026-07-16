import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email or phone is required';
    if (!form.password) e.password = 'Password is required';
    if (form.password && form.password.length < 6) e.password = 'Minimum 6 characters';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await login(form.email, form.password, form.remember);
      if (res.success) {
        toast.success('Welcome back! 🛡️');
        navigate('/permissions');
      }
    } catch {
      toast.error('Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex ${isDark ? 'dark' : 'light'}`}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-brand-900 via-brand-800 to-dark-900 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xl font-bold">SafeWatch TN</span>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            AI-Powered<br/>
            <span className="text-gradient">Safety Monitoring</span><br/>
            for Tamil Nadu
          </h1>
          <p className="text-slate-300 text-lg">
            Real-time emergency alerts, interactive district mapping, and smartwatch integration to keep everyone safe.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-8">
            {[
              { label: 'Districts Covered', value: '38' },
              { label: 'Active Watches', value: '1.2K+' },
              { label: 'Alerts Resolved', value: '4,500+' },
              { label: 'Response Time', value: '<2 min' },
            ].map(s => (
              <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-brand-300">{s.value}</div>
                <div className="text-slate-400 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-slate-500 text-sm relative z-10">
          © 2025 SafeWatch Tamil Nadu. All rights reserved.
        </div>
      </div>

      {/* Right panel */}
      <div className={`flex-1 flex flex-col justify-center items-center p-8 ${isDark ? 'bg-dark-950' : 'bg-slate-50'}`}>
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="lg:hidden flex items-center gap-2 mb-4">
                <Shield className="w-7 h-7 text-brand-500" />
                <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>SafeWatch TN</span>
              </div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Welcome back</h2>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sign in to your safety dashboard</p>
            </div>
            <button onClick={toggleTheme} className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-slate-200 text-slate-600 hover:text-slate-900'}`}>
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Demo hint */}
          <div className={`flex items-start gap-2 p-3 rounded-xl text-xs border ${isDark ? 'bg-brand-500/10 border-brand-500/20 text-brand-300' : 'bg-brand-50 border-brand-200 text-brand-700'}`}>
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Demo mode: Enter any email & password (min 6 chars) to login</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email or Phone Number</label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="admin@safetytamil.in"
                  className={`input pl-10 ${isDark ? 'dark' : 'light'} ${errors.email ? 'border-red-500' : ''}`}
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`input pl-10 pr-10 ${isDark ? 'dark' : 'light'} ${errors.password ? 'border-red-500' : ''}`}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" checked={form.remember} onChange={e => setForm(f => ({ ...f, remember: e.target.checked }))} />
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <p className={`text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
