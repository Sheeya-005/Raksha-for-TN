import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PermissionsPage from './pages/PermissionsPage';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import AlertsPage from './pages/AlertsPage';
import NotificationsPage from './pages/NotificationsPage';
import DistrictsPage from './pages/DistrictsPage';
import SmartwatchPage from './pages/SmartwatchPage';
import ContactsPage from './pages/ContactsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';

function ProtectedRoutes() {
  const { user, loading, permissionsGranted } = useAuth();
  const { isDark } = useTheme();
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'dark bg-dark-950' : 'light bg-slate-50'}`}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!permissionsGranted) return <Navigate to="/permissions" replace />;

  const handleDistrictChange = (district) => {
    setSelectedDistrict(district ? district.name : null);
  };

  return (
    <AppShell selectedDistrict={selectedDistrict} onDistrictChange={handleDistrictChange}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage selectedDistrict={selectedDistrict} />} />
        <Route path="/map" element={
          <MapPage
            selectedDistrict={selectedDistrict}
            onDistrictChange={handleDistrictChange}
          />
        } />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/districts" element={<DistrictsPage onDistrictChange={handleDistrictChange} />} />
        <Route path="/smartwatch" element={<SmartwatchPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
}

function AuthRoutes() {
  const { user, permissionsGranted } = useAuth();
  if (user && !permissionsGranted) return <Navigate to="/permissions" replace />;
  if (user && permissionsGranted) return <Navigate to="/dashboard" replace />;
  return null;
}

function AppRoutes() {
  const { isDark } = useTheme();
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: isDark ? '#1e293b' : '#fff',
            color: isDark ? '#f1f5f9' : '#1e293b',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
            borderRadius: '12px',
            fontSize: '13px',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/permissions" element={
          <RequireAuth>
            <PermissionsPage />
          </RequireAuth>
        } />
        <Route path="/*" element={<ProtectedRoutes />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
