import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import alertRoutes from './routes/alerts.js';
import deviceRoutes from './routes/devices.js';
import districtRoutes from './routes/districts.js';
import { setupSocketHandlers } from './socket/handlers.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/districts', districtRoutes);

// WebSocket handlers
setupSocketHandlers(io);

// Connect DB and start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🛡️  SafeWatch TN Backend running on port ${PORT}`);
    console.log(`🔌 WebSocket server ready`);
    console.log(`🌐 API: http://localhost:${PORT}/api`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  console.log('Starting without database (demo mode)...');
  httpServer.listen(PORT, () => {
    console.log(`🛡️  SafeWatch TN Backend running on port ${PORT} (demo mode)`);
  });
});

export { io };
