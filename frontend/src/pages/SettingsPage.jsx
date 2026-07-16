import { useState } from 'react';
import { Moon, Sun, Bell, Volume2, VolumeX, Lock, Shield, Trash2, Globe, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

function Toggle({ checked, onChange, color = 'bg-brand-500' }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? color : 'bg-slate-600'}`}
    >
      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

export default function SettingsPage() {
  const { isDark, toggleTheme } = useTheme();
  const [settings, setSettings] = useState({
    notifications: true,
    sound: true,
    sosAlerts: true,
    fallAlerts: true,
    batteryAlerts: true,
    offlineAlerts: true,
    emailAlerts: false,
    language: 'English',
  });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    setSaving(false);
    toast.success('Settings saved!');
  };

  const handleChangePw = async () => {
    if (!pwForm.current || !pwForm.newPw) { toast.error('Fill all fields'); return; }
    if (pwForm.newPw !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    await new Promise(r => setTimeout(r, 600));
    toast.success('Password changed!');
    setPwForm({ current: '', newPw: '', confirm: '' });
  };

  const Section = ({ title, children }) => (
    <div className={`card p-5 space-y-4 ${isDark ? 'dark' : 'light'}`}>
      <h3 className={`font-semibold text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{title}</h3>
      {children}
    </div>
  );

  const ToggleRow = ({ label, desc, settingKey, color }) => (
    <div className="flex items-center justify-between py-1">
      <div>
        <div className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{label}</div>
        {desc && <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{desc}</div>}
      </div>
      <Toggle checked={settings[settingKey]} onChange={() => toggle(settingKey)} color={color} />
    </div>
  );

  return (
    <div className="p-6 space-y-5 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Settings</h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Manage your preferences</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex items-center gap-2 px-4 py-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? 'Saving…' : 'Save All'}
        </button>
      </div>

      {/* Appearance */}
      <Section title="🎨 Appearance">
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Theme Mode</div>
            <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Choose your preferred display mode</div>
          </div>
          <div className={`flex items-center gap-1 p-1 rounded-xl border ${isDark ? 'bg-dark-800 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
            <button
              onClick={() => isDark && toggleTheme()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!isDark ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Sun className="w-3.5 h-3.5" /> Light
            </button>
            <button
              onClick={() => !isDark && toggleTheme()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isDark ? 'bg-dark-700 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Moon className="w-3.5 h-3.5" /> Dark
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Language</div>
            <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Interface language</div>
          </div>
          <select
            className={`input py-1.5 text-xs w-36 ${isDark ? 'bg-dark-800 border-white/10 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
            value={settings.language}
            onChange={e => setSettings(s => ({ ...s, language: e.target.value }))}
          >
            {['English', 'Tamil', 'Hindi', 'Telugu'].map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
      </Section>

      {/* Notifications */}
      <Section title="🔔 Notifications">
        <ToggleRow label="Push Notifications" desc="Receive alerts on your device" settingKey="notifications" />
        <ToggleRow label="Alert Sound" desc="Play sound for incoming alerts" settingKey="sound" />
        <div className={`border-t pt-3 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
          <div className={`text-xs font-medium mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Alert Types</div>
          <ToggleRow label="SOS Alerts" settingKey="sosAlerts" color="bg-red-500" />
          <ToggleRow label="Fall Detection" settingKey="fallAlerts" color="bg-orange-500" />
          <ToggleRow label="Low Battery Alerts" settingKey="batteryAlerts" color="bg-yellow-500" />
          <ToggleRow label="Device Offline Alerts" settingKey="offlineAlerts" color="bg-gray-500" />
          <ToggleRow label="Email Notifications" settingKey="emailAlerts" />
        </div>
      </Section>

      {/* Security */}
      <Section title="🔐 Security">
        <div className="space-y-3">
          {[
            { label: 'Current Password', key: 'current' },
            { label: 'New Password', key: 'newPw' },
            { label: 'Confirm New Password', key: 'confirm' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`input pl-10 pr-10 py-2.5 text-sm ${isDark ? 'dark' : 'light'}`}
                  value={pwForm[key]}
                  onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                />
                {key === 'confirm' && (
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
          <button onClick={handleChangePw} className="btn-primary text-sm py-2.5 w-full">
            Update Password
          </button>
        </div>
      </Section>

      {/* Danger zone */}
      <div className={`card p-5 border-red-500/20 ${isDark ? 'dark bg-red-500/5' : 'light bg-red-50'}`}>
        <h3 className="font-semibold text-sm text-red-400 mb-3">⚠️ Danger Zone</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Delete Account</div>
            <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>This action is irreversible</div>
          </div>
          <button
            onClick={() => toast.error('Account deletion requires admin confirmation')}
            className="px-4 py-2 text-xs font-medium text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
