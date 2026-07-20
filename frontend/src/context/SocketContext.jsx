import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);
const getSocketUrl = () => {
  const { protocol, hostname, port } = window.location;
  if (port === '5173') {
    return `${protocol}//${hostname}:5000`;
  }
  return `${protocol}//${hostname}${port ? ':' + port : ''}`;
};
const SOCKET_URL = getSocketUrl();

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [assignedAlert, setAssignedAlert] = useState(null);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [liveResponders, setLiveResponders] = useState({});

  useEffect(() => {
    // Connect to WebSocket server
    const newSocket = io(SOCKET_URL, {
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('🔌 Connected to Socket.io Server!');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('🔌 Disconnected from Socket.io Server');
    });

    // Listen for new alerts (for Admin dashboard / general system)
    newSocket.on('alert:new', (alert) => {
      setLiveAlerts(prev => [alert, ...prev].slice(0, 50));
      setActiveAlertsCount(c => c + 1);
      
      // Play SOS sound / visual alert
      toast((t) => (
        <span className="flex items-center gap-2 font-bold text-red-500">
          🚨 CRITICAL SOS: {alert.victimName} triggered emergency!
        </span>
      ), { duration: 6000 });
    });

    // Listen for alert updates (status changes)
    newSocket.on('alert:update', (updatedAlert) => {
      setLiveAlerts(prev => prev.map(a => a.id === updatedAlert.id ? updatedAlert : a));
      
      // If the currently assigned alert was updated (e.g. resolved), synchronize state
      setAssignedAlert(prev => {
        if (prev && prev.alert.id === updatedAlert.id) {
          if (updatedAlert.status === 'Resolved') {
            toast.success('Incident has been resolved safely.');
            return null; // clear overlay
          }
          return { ...prev, alert: updatedAlert };
        }
        return prev;
      });
    });

    // Listen for live responder location updates (Admin panel monitoring)
    newSocket.on('responder:location:changed', (data) => {
      const { userId, lat, lng } = data;
      setLiveResponders(prev => ({
        ...prev,
        [userId]: { lat, lng, lastUpdate: new Date() }
      }));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Set up user room registration once user logs in
  useEffect(() => {
    if (socket && connected && user) {
      // Register user to socket rooms
      socket.emit('user:register', { userId: user.id, role: user.role });

      // Listen for targeted dispatch alerts (for Police / Volunteer)
      socket.on('alert:dispatch', (data) => {
        console.log('🎯 Dispatch received:', data);
        setAssignedAlert(data);
        
        // Show emergency dialog toast
        toast.error(`⚠️ NEW DISPATCH: Respond immediately to ${data.alert.victimName}!`, {
          duration: 10000,
          position: 'top-center'
        });
      });
    }

    return () => {
      if (socket) {
        socket.off('alert:dispatch');
      }
    };
  }, [socket, connected, user]);

  const emitLocation = (lat, lng) => {
    if (socket && connected && user) {
      socket.emit('responder:location:update', { userId: user.id, lat, lng });
    }
  };

  const emitSmartwatchSos = (sosData) => {
    if (socket && connected) {
      socket.emit('smartwatch:sos', sosData);
    }
  };

  const clearAssignedAlert = () => {
    setAssignedAlert(null);
  };

  return (
    <SocketContext.Provider value={{
      socket,
      connected,
      liveAlerts,
      assignedAlert,
      liveResponders,
      activeAlertsCount,
      emitLocation,
      emitSmartwatchSos,
      clearAssignedAlert,
      setLiveAlerts
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
