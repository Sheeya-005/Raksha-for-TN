import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);
const getApiUrl = () => {
  const { protocol, hostname, port } = window.location;
  if (port === '5173') {
    return `${protocol}//${hostname}:5000/api`;
  }
  return `${protocol}//${hostname}${port ? ':' + port : ''}/api`;
};
const API_URL = getApiUrl();

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

  const login = async (email, password, role) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password, role });
      const { token: userToken, user: userData } = response.data;

      setToken(userToken);
      setUser(userData);
      localStorage.setItem('safety_token', userToken);
      localStorage.setItem('safety_user', JSON.stringify(userData));
      
      // Check if location permission is already stored
      const storedPerms = localStorage.getItem('safety_permissions');
      setPermissionsGranted(storedPerms === 'true');
      
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const signup = async (formData) => {
    try {
      await axios.post(`${API_URL}/auth/signup`, formData);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed. Please try again.';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    // If logged in, update status to Offline in backend first
    if (user && user.role !== 'admin') {
      axios.patch(`${API_URL}/users/${user.id}/status`, { status: 'Offline' }, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => console.log('Error updating status on logout:', err));
    }

    setToken(null);
    setUser(null);
    setPermissionsGranted(false);
    localStorage.removeItem('safety_token');
    localStorage.removeItem('safety_user');
    localStorage.removeItem('safety_permissions');
    toast.success('Logged out successfully.');
  };

  const grantPermissions = () => {
    setPermissionsGranted(true);
    localStorage.setItem('safety_permissions', 'true');
  };

  const updateLocation = async (lat, lng) => {
    if (!user) return;
    try {
      await axios.patch(`${API_URL}/users/${user.id}/location`, { lat, lng });
      const updatedUser = { ...user, lat, lng };
      setUser(updatedUser);
      localStorage.setItem('safety_user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Error syncing location to backend:', err);
    }
  };

  const updateStatus = async (status) => {
    if (!user) return;
    try {
      await axios.patch(`${API_URL}/users/${user.id}/status`, { status });
      const updatedUser = { ...user, availabilityStatus: status };
      setUser(updatedUser);
      localStorage.setItem('safety_user', JSON.stringify(updatedUser));
      toast.success(`Availability updated to ${status}`);
    } catch (err) {
      console.error('Error syncing status to backend:', err);
      toast.error('Failed to update availability status.');
    }
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
      updateLocation, updateStatus,
      isAdmin: user?.role === 'admin',
      isPolice: user?.role === 'police',
      isVolunteer: user?.role === 'volunteer'
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
