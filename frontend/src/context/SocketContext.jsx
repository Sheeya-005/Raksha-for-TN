import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { MOCK_ALERTS, MOCK_NOTIFICATIONS } from '../data/mockData';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Simulate WebSocket connection
    setTimeout(() => setConnected(true), 1500);
    const unread = MOCK_NOTIFICATIONS.filter(n => !n.read).length;
    setUnreadCount(unread);

    // Simulate incoming alerts every 15s
    intervalRef.current = setInterval(() => {
      const randomAlert = MOCK_ALERTS[Math.floor(Math.random() * MOCK_ALERTS.length)];
      const newAlert = {
        ...randomAlert,
        id: `LIVE_${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'Active',
      };
      setLiveAlerts(prev => [newAlert, ...prev].slice(0, 5));
      setUnreadCount(c => c + 1);
    }, 15000);

    return () => clearInterval(intervalRef.current);
  }, []);

  const markAllRead = () => setUnreadCount(0);

  return (
    <SocketContext.Provider value={{ connected, liveAlerts, unreadCount, markAllRead }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
