import { useState, useRef } from 'react';
import { User, Mail, Phone, MapPin, Heart, Watch, Camera, Save, Loader2, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { isDark } = useTheme();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bloodGroup: user?.bloodGroup || 'O+',
    medicalInfo: user?.medicalInfo || '',
    watchId: user?.watchId || '',
  });
  const fileRef = useRef(null);

  const handleSave = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    updateProfile(form);
    setEditing(false);
    setLoading(false);
    toast.success('Profile updated!');
  };

  const Field = ({ label, name, icon: Icon, type = 'text', options }) => (
    <div>
      <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</label>
      <div className="relative">
        {Icon && <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />}
        {options ? (
          <select
            disabled={!editing}
            className={`input py-2.5 text-sm ${Icon ? 'pl-10' : ''} ${isDark ? 'bg-dark-800 border-white/10 text-slate-200 disabled:opacity-60' : 'bg-white border-slate-200 text-slate-700 disabled:opacity-60'}`}
            value={form[name]}
            onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          >
            {options.map(o => <option key={o}>{o}</option>)}
          </select>
        ) : (
          <input
            type={type}
            disabled={!editing}
            className={`input py-2.5 text-sm ${Icon ? 'pl-10' : ''} ${isDark ? 'dark disabled:opacity-60' : 'light disabled:opacity-60'}`}
            value={form[name]}
            onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>User Profile</h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Manage your personal information</p>
        </div>
        {!editing
          ? <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-2 text-sm px-4 py-2">
              <Pencil className="w-3.5 h-3.5" /> Edit Profile
            </button>
          : <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
              <button onClick={handleSave} disabled={loading} className="btn-primary text-sm px-4 py-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-3.5 h-3.5" /> Save</>}
              </button>
            </div>
        }
      </div>

      {/* Profile header */}
      <div className={`card p-6 ${isDark ? 'dark' : 'light'}`}>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-brand-500/30">
              {form.name.charAt(0) || 'U'}
            </div>
            {editing && (
              <button
                onClick={() => fileRef.current.click()}
                className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-lg"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{form.name}</h2>
            <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{form.email}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`badge text-xs ${isDark ? 'bg-brand-500/10 border-brand-500/20 text-brand-400' : 'bg-brand-50 border-brand-200 text-brand-600'}`}>
                {user?.role === 'admin' ? '🛡️ Admin' : '👤 User'}
              </span>
              <span className={`badge text-xs ${isDark ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-green-50 border-green-200 text-green-600'}`}>
                ✓ Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`card p-5 space-y-4 ${isDark ? 'dark' : 'light'}`}>
          <h3 className={`font-semibold text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Personal Information</h3>
          <Field label="Full Name" name="name" icon={User} />
          <Field label="Email Address" name="email" icon={Mail} type="email" />
          <Field label="Phone Number" name="phone" icon={Phone} />
          <Field label="Address" name="address" icon={MapPin} />
        </div>

        <div className={`card p-5 space-y-4 ${isDark ? 'dark' : 'light'}`}>
          <h3 className={`font-semibold text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Medical & Device Info</h3>
          <Field label="Blood Group" name="bloodGroup" icon={Heart} options={BLOOD_GROUPS} />
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Medical Information</label>
            <textarea
              disabled={!editing}
              rows={3}
              className={`input py-2.5 text-sm resize-none ${isDark ? 'dark disabled:opacity-60' : 'light disabled:opacity-60'}`}
              value={form.medicalInfo}
              onChange={e => setForm(f => ({ ...f, medicalInfo: e.target.value }))}
              placeholder="Known allergies, conditions, medications..."
            />
          </div>
          <Field label="Smartwatch ID" name="watchId" icon={Watch} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Alerts', value: '12', color: 'text-red-400' },
          { label: 'Days Active', value: '47', color: 'text-blue-400' },
          { label: 'Contacts', value: '3', color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className={`card p-4 text-center ${isDark ? 'dark' : 'light'}`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
