import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';

// Pages imports
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PermissionsPage from './pages/PermissionsPage';
import DistrictSelectionPage from './pages/DistrictSelectionPage';
import BandSimulator from './pages/BandSimulator';
import AdminDashboard from './pages/AdminDashboard';
import PoliceDashboard from './pages/PoliceDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import PhoneSosPage from './pages/PhoneSosPage';

function ProtectedRoute({ children, allowedRole }) {
  const { user, loading, permissionsGranted } = useAuth();
  const { isDark } = useTheme();

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider">Syncing safety protocols…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  
  if (user.role !== 'admin' && !permissionsGranted) {
    if (window.location.pathname !== '/permissions') {
      return <Navigate to="/permissions" replace />;
    }
  }
  
  // Ensure intermediate district selection is completed
  if (!user.selectedDistrict && window.location.pathname !== '/select-district' && window.location.pathname !== '/permissions') {
    return <Navigate to="/select-district" replace />;
  }
  
  if (allowedRole && user.role !== allowedRole) {
    // Role mismatch
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  const { isDark } = useTheme();
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: isDark ? '#0f172a' : '#fff',
            color: isDark ? '#f1f5f9' : '#0f172a',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: 'bold',
            padding: '12px 16px'
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/volunteer/register" element={<RegisterPage />} />
        <Route path="/simulator" element={<BandSimulator />} />
        <Route path="/sos" element={<PhoneSosPage />} />
        
        {/* Permission Gateway */}
        <Route path="/permissions" element={
          <ProtectedRoute>
            <PermissionsPage />
          </ProtectedRoute>
        } />

        {/* Intermediate District Selection */}
        <Route path="/select-district" element={
          <ProtectedRoute>
            <DistrictSelectionPage />
          </ProtectedRoute>
        } />

        {/* Protected Dashboard Panels */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/police/dashboard" element={
          <ProtectedRoute allowedRole="police">
            <PoliceDashboard />
          </ProtectedRoute>
        } />

        <Route path="/volunteer/dashboard" element={
          <ProtectedRoute allowedRole="volunteer">
            <VolunteerDashboard />
          </ProtectedRoute>
        } />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
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
