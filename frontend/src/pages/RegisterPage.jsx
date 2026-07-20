import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, Home, ShieldAlert, ArrowLeft, Loader2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { signup } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: 'Female',
    address: '',
    emergencyName: '',
    emergencyRelation: 'Spouse',
    emergencyPhone: ''
  });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full Name is required';
    if (!form.email.trim()) e.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.address.trim()) e.address = 'Home address is required';
    if (!form.emergencyName.trim()) e.emergencyName = 'Emergency contact name is required';
    if (!form.emergencyPhone.trim()) e.emergencyPhone = 'Emergency contact phone is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      toast.error('Please fix validation errors first.');
      return;
    }
    
    setErrors({});
    setLoading(true);

    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        gender: form.gender,
        address: form.address,
        emergencyContacts: [
          {
            name: form.emergencyName,
            relationship: form.emergencyRelation,
            phone: form.emergencyPhone
          }
        ]
      };

      const res = await signup(payload);
      if (res.success) {
        toast.success('Registration successful! Please log in with your credentials.');
        navigate('/login');
      }
    } catch (err) {
      // toast.error is already handled in AuthContext
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 ${isDark ? 'dark bg-slate-950 text-slate-100' : 'light bg-slate-50 text-slate-800'}`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <button 
          onClick={() => navigate('/')} 
          className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border w-fit mb-6 ${
            isDark ? 'border-slate-800 hover:bg-slate-900 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home Portal
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Volunteer Registration</h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Become a community safety responder and save lives.</p>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className={`py-8 px-6 shadow-xl rounded-2xl border backdrop-blur-sm ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Full Name */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="name@email.com"
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Phone Number */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 XXXXX XXXXX"
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>

              {/* Gender */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Gender</label>
                <select
                  className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                  value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  />
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                    value={form.confirmPassword}
                    onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  />
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

            </div>

            {/* Address */}
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Residential Address</label>
              <div className="relative">
                <Home className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <textarea
                  required
                  rows={2}
                  placeholder="Enter full home address"
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                />
              </div>
              {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
            </div>

            {/* Emergency Contact Section */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-red-500">
                <ShieldAlert className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Emergency Contact Details</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Contact Name */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Contact Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Name"
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                    value={form.emergencyName}
                    onChange={e => setForm(f => ({ ...f, emergencyName: e.target.value }))}
                  />
                  {errors.emergencyName && <p className="text-red-400 text-xs mt-1">{errors.emergencyName}</p>}
                </div>

                {/* Relationship */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Relationship</label>
                  <select
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                    value={form.emergencyRelation}
                    onChange={e => setForm(f => ({ ...f, emergencyRelation: e.target.value }))}
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Friend</option>
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Contact Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="Phone"
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                    value={form.emergencyPhone}
                    onChange={e => setForm(f => ({ ...f, emergencyPhone: e.target.value }))}
                  />
                  {errors.emergencyPhone && <p className="text-red-400 text-xs mt-1">{errors.emergencyPhone}</p>}
                </div>

              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-500 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating Account…</>
              ) : (
                'Register as Volunteer'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Already registered?{' '}
              <Link to="/login?role=volunteer" className="text-cyan-500 hover:underline font-bold">
                Log In here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
