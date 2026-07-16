import { useState } from 'react';
import { Phone, Mail, User, Heart, Plus, Pencil, Trash2, Star, X, Loader2 } from 'lucide-react';
import { MOCK_CONTACTS } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const RELATIONSHIPS = ['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Sibling', 'Friend', 'Colleague', 'Other'];
const EMPTY_FORM = { name: '', relationship: 'Friend', phone: '', email: '' };

function ContactModal({ contact, isDark, onSave, onClose }) {
  const [form, setForm] = useState(contact || EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.phone) { toast.error('Name and phone are required'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    onSave(form);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`relative w-full max-w-md rounded-2xl border shadow-2xl animate-fade-in
          ${isDark ? 'bg-dark-800 border-white/10' : 'bg-white border-slate-200'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {contact ? 'Edit Contact' : 'Add Contact'}
          </h3>
          <button onClick={onClose} className={`p-1 rounded-lg ${isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {[
            { label: 'Full Name', name: 'name', icon: User, placeholder: 'Kavitha Arun' },
            { label: 'Phone Number', name: 'phone', icon: Phone, placeholder: '+91 9876543210' },
            { label: 'Email Address', name: 'email', icon: Mail, placeholder: 'kavitha@email.com' },
          ].map(({ label, name, icon: Icon, placeholder }) => (
            <div key={name}>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{label}</label>
              <div className="relative">
                <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder={placeholder}
                  className={`input pl-10 py-2.5 text-sm ${isDark ? 'dark' : 'light'}`}
                  value={form[name]}
                  onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
                />
              </div>
            </div>
          ))}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Relationship</label>
            <select
              className={`input py-2.5 text-sm ${isDark ? 'bg-dark-800 border-white/10 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
              value={form.relationship}
              onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}
            >
              {RELATIONSHIPS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="btn-primary flex-1 py-2.5 text-sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Contact'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const { isDark } = useTheme();
  const [contacts, setContacts] = useState(MOCK_CONTACTS);
  const [modal, setModal] = useState(null); // null | 'add' | contact object

  const handleSave = (form) => {
    if (modal === 'add') {
      setContacts(c => [...c, { ...form, id: `C${Date.now()}`, isPrimary: false }]);
      toast.success('Contact added!');
    } else {
      setContacts(c => c.map(x => x.id === modal.id ? { ...x, ...form } : x));
      toast.success('Contact updated!');
    }
    setModal(null);
  };

  const handleDelete = (id) => {
    setContacts(c => c.filter(x => x.id !== id));
    toast.success('Contact removed');
  };

  const handlePrimary = (id) => {
    setContacts(c => c.map(x => ({ ...x, isPrimary: x.id === id })));
    toast.success('Primary contact updated!');
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Emergency Contacts</h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{contacts.length} contacts · {contacts.filter(c => c.isPrimary).length} primary</p>
        </div>
        <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map(c => (
          <div key={c.id} className={`card p-5 ${isDark ? 'dark' : 'light'} animate-fade-in`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <div className={`font-semibold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{c.name}</div>
                  <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{c.relationship}</div>
                </div>
              </div>
              <button
                onClick={() => handlePrimary(c.id)}
                className={`p-1.5 rounded-lg transition-colors ${c.isPrimary ? 'text-yellow-400' : isDark ? 'text-slate-600 hover:text-yellow-400' : 'text-slate-300 hover:text-yellow-400'}`}
                title="Set as Primary"
              >
                <Star className={`w-4 h-4 ${c.isPrimary ? 'fill-current' : ''}`} />
              </button>
            </div>

            {c.isPrimary && (
              <div className={`mb-3 px-2 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20`}>
                <Star className="w-3 h-3 fill-current" /> Primary Contact
              </div>
            )}

            <div className="space-y-2">
              <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <Phone className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                {c.phone}
              </div>
              <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <Mail className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                {c.email}
              </div>
            </div>

            <div className={`flex gap-2 mt-4 pt-4 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
              <button onClick={() => setModal(c)} className="btn-secondary flex-1 py-1.5 text-xs flex items-center justify-center gap-1">
                <Pencil className="w-3 h-3" /> Edit
              </button>
              <button onClick={() => handleDelete(c.id)} className="px-3 py-1.5 rounded-xl text-xs text-red-400 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </div>
        ))}

        {/* Add card */}
        <button
          onClick={() => setModal('add')}
          className={`card p-5 border-dashed flex flex-col items-center justify-center gap-2 min-h-[200px] cursor-pointer transition-all hover:scale-[1.01] ${isDark ? 'dark border-white/10 hover:border-brand-500/30' : 'light border-slate-300 hover:border-brand-400/50'}`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
            <Plus className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
          </div>
          <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Add Contact</span>
        </button>
      </div>

      {modal && (
        <ContactModal
          contact={modal === 'add' ? null : modal}
          isDark={isDark}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
