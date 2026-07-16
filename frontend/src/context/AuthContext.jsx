import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const MOCK_ADMIN = {
  id: 'USR0001',
  name: 'Admin User',
  email: 'admin@safetytamil.in',
  phone: '+91 9876543210',
  role: 'admin',
  watchId: 'SW1001',
  bloodGroup: 'O+',
  address: 'Chennai, Tamil Nadu',
  medicalInfo: 'No known allergies',
  profilePhoto: null,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('safety_token');
    const storedUser = localStorage.getItem('safety_user');
    const storedPerms = localStorage.getItem('safety_permissions');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setPermissionsGranted(storedPerms === 'true');
    }
    setLoading(false);
  }, []);

  const login = async (email, password, remember) => {
    // Mock authentication — accept any credentials
    await new Promise(r => setTimeout(r, 1000));
    const mockToken = `jwt_${Date.now()}_mock`;
    const userData = { ...MOCK_ADMIN, email: email || MOCK_ADMIN.email };
    setToken(mockToken);
    setUser(userData);
    if (remember) {
      localStorage.setItem('safety_token', mockToken);
      localStorage.setItem('safety_user', JSON.stringify(userData));
    }
    return { success: true };
  };

  const signup = async (data) => {
    await new Promise(r => setTimeout(r, 1200));
    const mockToken = `jwt_${Date.now()}_mock`;
    const userData = { ...MOCK_ADMIN, ...data, role: 'user' };
    setToken(mockToken);
    setUser(userData);
    localStorage.setItem('safety_token', mockToken);
    localStorage.setItem('safety_user', JSON.stringify(userData));
    return { success: true };
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setPermissionsGranted(false);
    localStorage.removeItem('safety_token');
    localStorage.removeItem('safety_user');
    localStorage.removeItem('safety_permissions');
  };

  const grantPermissions = () => {
    setPermissionsGranted(true);
    localStorage.setItem('safety_permissions', 'true');
  };

  const updateProfile = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('safety_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading, permissionsGranted,
      login, signup, logout, grantPermissions, updateProfile,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
