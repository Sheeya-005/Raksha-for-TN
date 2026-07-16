import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, Lock, Mail, User, Phone, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const { signup } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'user' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (!form.password) e.password = 'Password is required';
    if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await signup(form);
      toast.success('Account created! 🎉');
      navigate('/permissions');
    } catch {
      toast.error('Signup failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = 'text', placeholder, icon: Icon, extra }) => (
    <div>
      <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{label}</label>
      <div className="relative">
        {Icon && <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />}
        <input
          type={name === 'password' || name === 'confirmPassword' ? (showPw ? 'text' : 'password') : type}
          placeholder={placeholder}
          className={`input ${Icon ? 'pl-10' : ''} ${extra || ''} ${errors[name] ? 'border-red-500' : ''}`}
          value={form[name]}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
        />
        {(name === 'password' || name === 'confirmPassword') && (
          <button type="button" onClick={() => setShowPw(!showPw)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {errors[name] && <p className="text-red-400 text-xs mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? 'dark bg-dark-950' : 'light bg-slate-50'}`}>
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Create Account</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Join SafeWatch Tamil Nadu Safety Platform</p>
        </div>

        <div className={`card p-8 space-y-5 ${isDark ? 'dark' : 'light'}`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full Name" name="name" placeholder="Arun Kumar" icon={User} />
            <Field label="Email Address" name="email" type="email" placeholder="arun@email.com" icon={Mail} />
            <Field label="Phone Number" name="phone" placeholder="+91 9876543210" icon={Phone} />

            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Role</label>
              <select
                className={`input ${isDark ? 'bg-dark-800 border-white/10 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value="user">User</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <Field label="Password" name="password" placeholder="••••••••" icon={Lock} />
            <Field label="Confirm Password" name="confirmPassword" placeholder="••••••••" icon={Lock} />

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : 'Create Account'}
            </button>
          </form>

          <p className={`text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
