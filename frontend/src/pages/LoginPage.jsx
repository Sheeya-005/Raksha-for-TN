import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Shield, Lock, Mail, AlertCircle, Loader2, ShieldAlert, Users, ArrowLeft, RefreshCw, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('role-select'); // role-select, credentials
  const [selectedRole, setSelectedRole] = useState(''); // admin, police, volunteer
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // CAPTCHA State
  const canvasRef = useRef(null);
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  // Generate random alphanumeric text for captcha
  const generateCaptchaText = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'; // omit ambiguous chars
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const drawCaptcha = (text) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fill background
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid noise lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 15) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 15) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(canvas.width, j);
      ctx.stroke();
    }

    // Write captcha text characters
    ctx.font = 'bold 22px Courier New';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const x = 20 + i * 22;
      const y = canvas.height / 2 + (Math.random() - 0.5) * 8;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.4); // random rotation
      
      // Random color for text
      const colors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#c084fc', '#2dd4bf'];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }

    // Draw overlapping line noises
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
  };

  const refreshCaptcha = () => {
    const text = generateCaptchaText();
    setCaptchaText(text);
    setCaptchaInput('');
    // Delay canvas draw slightly to ensure DOM has updated if moving steps
    setTimeout(() => drawCaptcha(text), 50);
  };

  // Draw captcha when step transitions or captchaText updates
  useEffect(() => {
    if (step === 'credentials' && captchaText) {
      const timer = setTimeout(() => {
        drawCaptcha(captchaText);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step, captchaText]);

  const selectRole = (role) => {
    setSelectedRole(role);
    setStep('credentials');
    setForm({ email: '', password: '' });
    refreshCaptcha();
  };

  const handleQuickLogin = async (role) => {
    setSelectedRole(role);
    setStep('credentials');
    
    let email = '';
    let password = '';
    if (role === 'admin') {
      email = 'admin@safetytamil.in';
      password = 'admin123';
    } else if (role === 'police') {
      email = 'police@safetytamil.in';
      password = 'police123';
    } else {
      email = 'volunteer@safetytamil.in';
      password = 'volunteer123';
    }
    setForm({ email, password });
    
    // Auto-generate, sync, and bypass captcha verification in state
    const tempCaptcha = generateCaptchaText();
    setCaptchaText(tempCaptcha);
    setCaptchaInput(tempCaptcha);

    setLoading(true);
    try {
      const res = await login(email, password, role);
      if (res.success) {
        toast.success(`Welcome back! Authenticated as ${role.toUpperCase()}`);
        navigate('/select-district');
      }
    } catch (err) {
      console.error(err);
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error('Please enter email and password.');
      return;
    }

    // CAPTCHA verification
    if (captchaInput.trim() !== captchaText) {
      toast.error('CAPTCHA verification failed. Please try again.');
      refreshCaptcha();
      return;
    }

    setLoading(true);
    try {
      const res = await login(form.email, form.password, selectedRole);
      if (res.success) {
        toast.success(`Welcome back! Authenticated as ${selectedRole.toUpperCase()}`);
        navigate('/select-district'); // intermediate district selector requested
      }
    } catch (err) {
      console.error(err);
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const getBrandingInfo = () => {
    if (selectedRole === 'admin') return { title: 'ADMIN COMMAND PORTAL', icon: Shield, color: 'text-red-500 bg-red-500/10 border-red-500/20' };
    if (selectedRole === 'police') return { title: 'POLICE DISPATCH PORTAL', icon: ShieldAlert, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
    return { title: 'VOLUNTEER PORTAL', icon: Users, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' };
  };

  const brand = getBrandingInfo();
  const Icon = brand.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-slate-100 p-6 select-none relative">
      
      {/* Visual background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6">
        
        {/* Portal Entry Selector */}
        {step === 'role-select' ? (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-500/10 rounded-xl border border-red-500/20 mb-2">
                <Shield className="w-6 h-6 text-red-500 animate-pulse" />
              </div>
              <h2 className="text-xl font-black text-white">SELECT YOUR ROLE</h2>
              <p className="text-[11px] text-slate-400 font-semibold tracking-wide">AUTHENTICATE TO ACCESS THE EMERGENCY OPERATION NETWORK</p>
            </div>

            <div className="space-y-3">
              {[
                { id: 'admin', title: 'ADMINISTRATOR', desc: 'Tamil Nadu Safety Dispatch Control Center', icon: Shield, color: 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 hover:border-red-500/30' },
                { id: 'police', title: 'POLICE OFFICER', desc: 'Law Enforcement First Responder Console', icon: ShieldAlert, color: 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 hover:border-blue-500/30' },
                { id: 'volunteer', title: 'VOLUNTEER / PEOPLE RESPONDER', desc: 'District Safety Community Circle Assistance', icon: Users, color: 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 hover:border-cyan-500/30' }
              ].map(roleItem => {
                const RoleIcon = roleItem.icon;
                return (
                  <div
                    key={roleItem.id}
                    className={`w-full p-4 rounded-xl border transition-all duration-200 flex flex-col gap-3 ${roleItem.color}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-bold text-white tracking-wide">{roleItem.title}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{roleItem.desc}</div>
                      </div>
                      <RoleIcon className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="mt-1">
                      <button
                        onClick={() => selectRole(roleItem.id)}
                        className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-white transition-all cursor-pointer text-center"
                      >
                        Proceed to Login
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-850 my-4 pt-4">
              <button
                onClick={() => navigate('/sos')}
                className="w-full p-4 rounded-xl border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 text-left transition-all duration-200 cursor-pointer flex items-center justify-between group"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-red-400 tracking-wide flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-red-500 animate-pulse" />
                    MOBILE SOS TEST CONSOLE
                  </div>
                  <div className="text-[9px] text-slate-400 font-semibold uppercase">
                    Connect real phone GPS as an active SOS tracker device
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-red-400 rotate-180 transition-all" />
              </button>
            </div>

            <div className="text-center py-2 space-y-1 border-t border-slate-850 pt-4">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">New to the platform?</p>
              <div className="flex items-center justify-center gap-4 text-xs">
                <Link to="/volunteer/register" className="text-cyan-500 hover:underline font-bold">Register as Volunteer</Link>
                <span className="text-slate-700">|</span>
                <Link to="/police/register" className="text-blue-500 hover:underline font-bold">Register as Officer</Link>
              </div>
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-1.5 py-3 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-900 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home Page
            </button>
          </div>
        ) : (
          /* Credentials Form Step */
          <div className="space-y-6 animate-fade-in">
            
            <button
              onClick={() => setStep('role-select')}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Select Role
            </button>

            {/* Role Header */}
            <div className="flex items-center gap-3 border-b pb-4 border-slate-800">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${brand.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold tracking-wide text-white uppercase">{brand.title}</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Verification Required</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Username */}
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider mb-1 text-slate-400">Username / Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="Enter email address"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-800 bg-[#0E1322] focus:outline-none focus:ring-1 focus:ring-red-500/50"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider mb-1 text-slate-400">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    placeholder="Enter password"
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-slate-800 bg-[#0E1322] focus:outline-none focus:ring-1 focus:ring-red-500/50"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* CAPTCHA SECTION */}
              <div className="pt-2 border-t border-slate-850 space-y-3">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Security Verification CAPTCHA</label>
                
                <div className="flex items-center gap-3">
                  {/* Captcha Canvas */}
                  <canvas 
                    ref={canvasRef} 
                    width={150} 
                    height={40} 
                    className="rounded-lg border border-slate-850"
                  />
                  <button 
                    type="button" 
                    onClick={refreshCaptcha}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-850 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Refresh CAPTCHA"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                 <input
                  type="text"
                  required
                  placeholder="Enter CAPTCHA text"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-800 bg-[#0E1322] focus:outline-none focus:ring-1 focus:ring-red-500/50 font-mono tracking-widest text-center"
                  value={captchaInput}
                  onChange={e => setCaptchaInput(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-95 shadow-lg active:scale-98 transition-all cursor-pointer"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Verifying Credentials…</> : 'Access Network'}
              </button>
            </form>

            {selectedRole === 'volunteer' && (
              <p className="text-center text-xs text-slate-500">
                Not a registered community volunteer?{' '}
                <Link to="/volunteer/register" className="text-cyan-500 hover:underline font-bold">Register as Volunteer</Link>
              </p>
            )}

            {selectedRole === 'police' && (
              <p className="text-center text-xs text-slate-500">
                Not a registered police officer?{' '}
                <Link to="/police/register" className="text-blue-500 hover:underline font-bold">Register as Officer</Link>
              </p>
            )}

            {selectedRole === 'admin' && (
              <p className="text-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Administrator access is restricted. Contact operations for credentials.
              </p>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
