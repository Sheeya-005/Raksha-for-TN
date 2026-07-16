import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Map, Bell, AlertTriangle, BarChart3,
  Watch, Phone, User, Settings, LogOut, Shield, X, Menu,
  ChevronLeft, ChevronRight, Wifi, WifiOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import NotificationBell from '../ui/NotificationBell';
import DistrictSelector from '../ui/DistrictSelector';

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/map', icon: Map, label: 'Live Map' },
  { path: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  { path: '/notifications', icon: Bell, label: 'Notifications' },
  { path: '/districts', icon: BarChart3, label: 'District Monitoring' },
  { path: '/smartwatch', icon: Watch, label: 'Smartwatch Status' },
  { path: '/contacts', icon: Phone, label: 'Emergency Contacts' },
  { path: '/profile', icon: User, label: 'User Profile' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppShell({ children, selectedDistrict, onDistrictChange }) {
  const { user, logout, isAdmin } = useAuth();
  const { connected, unreadCount } = useSocket();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/30">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>SafeWatch TN</div>
            <div className="text-xs text-brand-400">Safety Monitoring</div>
          </div>
        )}
      </div>

      {/* Connection status */}
      <div className={`mx-3 mb-4 px-3 py-2 rounded-xl flex items-center gap-2 ${
        connected
          ? isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'
          : isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'
      } ${collapsed ? 'justify-center' : ''}`}>
        {connected
          ? <><div className="w-2 h-2 rounded-full bg-green-400 live-pulse" />{!collapsed && <span className="text-xs text-green-400 font-medium">Live Connected</span>}</>
          : <><WifiOff className="w-3 h-3 text-red-400" />{!collapsed && <span className="text-xs text-red-400">Disconnected</span>}</>
        }
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Admin Panel' : undefined}
          >
            <Shield className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Admin Panel</span>}
          </NavLink>
        )}
      </nav>

      {/* User + Logout */}
      <div className={`p-3 border-t ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
        {!collapsed && (
          <div className={`flex items-center gap-3 px-3 py-2 mb-2 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <div className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{user?.name}</div>
              <div className={`text-xs truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{user?.role}</div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? 'dark' : 'light'}`}>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 border-r
        ${collapsed ? 'w-16' : 'w-60'}
        ${isDark ? 'bg-dark-900 border-white/5' : 'bg-white border-slate-200'}
      `}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className={`relative w-64 flex flex-col ${isDark ? 'bg-dark-900' : 'bg-white'}`}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className={`flex items-center gap-3 px-4 py-3 border-b flex-shrink-0 ${
          isDark ? 'bg-dark-900/80 border-white/5 backdrop-blur-md' : 'bg-white/80 border-slate-200 backdrop-blur-md'
        }`}>
          {/* Mobile menu toggle */}
          <button onClick={() => setMobileOpen(true)} className={`lg:hidden p-2 rounded-xl ${isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100'}`}>
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden lg:flex p-2 rounded-xl transition-colors ${isDark ? 'text-slate-500 hover:text-slate-300 hover:bg-white/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* District Selector */}
          <div className="flex-1 max-w-xs">
            <DistrictSelector value={selectedDistrict} onChange={onDistrictChange} />
          </div>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <NotificationBell count={unreadCount} />
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border
              ${isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'} live-pulse`} />
              {connected ? 'Live' : 'Offline'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={`flex-1 overflow-auto ${isDark ? 'bg-dark-950' : 'bg-slate-50'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
