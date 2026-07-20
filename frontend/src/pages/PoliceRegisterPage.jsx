import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, ShieldAlert, ArrowLeft, Loader2, CreditCard, Award, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { TN_DISTRICTS } from '../data/districts';
import toast from 'react-hot-toast';

export default function PoliceRegisterPage() {
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
    gender: 'Male',
    policeIdCardNumber: '',
    batchNumber: '',
    selectedDistrict: 'Chennai'
  });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full Name is required';
    if (!form.email.trim()) e.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.policeIdCardNumber.trim()) e.policeIdCardNumber = 'Police ID Card Number is required';
    if (!form.batchNumber.trim()) e.batchNumber = 'Batch Number is required';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
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
        role: 'police',
        policeIdCardNumber: form.policeIdCardNumber,
        batchNumber: form.batchNumber,
        selectedDistrict: form.selectedDistrict
      };

      const res = await signup(payload);
      if (res.success) {
        toast.success('Registration successful! Location permission is now required.');
        navigate('/permissions');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 ${isDark ? 'dark bg-[#070A13] text-slate-100' : 'light bg-slate-50 text-slate-800'}`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <button 
          onClick={() => navigate('/login')} 
          className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border w-fit mb-6 cursor-pointer ${
            isDark ? 'border-slate-800 hover:bg-slate-900 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Police Officer Registration</h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Register your first responder console credentials.</p>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className={`py-8 px-6 shadow-xl rounded-2xl border backdrop-blur-sm ${
          isDark ? 'bg-slate-900/60 border-slate-905' : 'bg-white border-slate-200'
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
                    placeholder="Inspector/Officer Name"
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                      isDark ? 'bg-[#0E1322] border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Official Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="officer@safetytamil.in"
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                      isDark ? 'bg-[#0E1322] border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Phone Number */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Official Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 XXXXX XXXXX"
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                      isDark ? 'bg-[#0E1322] border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
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
                  className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    isDark ? 'bg-[#0E1322] border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                  value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Police ID Card Number */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Police ID Card Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. TNP-2026-9874"
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                      isDark ? 'bg-[#0E1322] border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                    value={form.policeIdCardNumber}
                    onChange={e => setForm(f => ({ ...f, policeIdCardNumber: e.target.value }))}
                  />
                </div>
                {errors.policeIdCardNumber && <p className="text-red-400 text-xs mt-1">{errors.policeIdCardNumber}</p>}
              </div>

              {/* Batch Number */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Batch Number</label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. BATCH-768"
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                      isDark ? 'bg-[#0E1322] border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                    value={form.batchNumber}
                    onChange={e => setForm(f => ({ ...f, batchNumber: e.target.value }))}
                  />
                </div>
                {errors.batchNumber && <p className="text-red-400 text-xs mt-1">{errors.batchNumber}</p>}
              </div>

              {/* Selected operating District */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Operating Station District</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <select
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                      isDark ? 'bg-[#0E1322] border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                    value={form.selectedDistrict}
                    onChange={e => setForm(f => ({ ...f, selectedDistrict: e.target.value }))}
                  >
                    {TN_DISTRICTS.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
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
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                      isDark ? 'bg-[#0E1322] border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  />
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="md:col-span-2">
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                      isDark ? 'bg-[#0E1322] border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                    value={form.confirmPassword}
                    onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  />
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 shadow-lg active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering Officer Profile…
                </>
              ) : (
                'Submit Officer Registration'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
