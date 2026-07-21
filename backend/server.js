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
import emergencyRoutes from './routes/emergency.js';
import { setupSocketHandlers } from './socket/handlers.js';
import { seedDatabase, setDbConnected } from './models/dbStore.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Set socket.io instance
app.set('io', io);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/districts', districtRoutes);
app.use('/api/emergency', emergencyRoutes);

// Serve static assets from frontend build
const frontendBuildPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendBuildPath));

// Fallback all other non-API routes to index.html for React SPA routing
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

// WebSocket handlers
setupSocketHandlers(io);

// Connect DB and start server
const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  // Set connection flag to true
  setDbConnected(true);
  // Seed initial records in MySQL
  await seedDatabase();
  
  httpServer.listen(PORT, () => {
    console.log(`🛡️  SafeWatch TN Backend running on port ${PORT}`);
    console.log(`🔌 WebSocket server ready`);
    console.log(`🌐 API: http://localhost:${PORT}/api`);
  });
}).catch(err => {
  console.error('Failed to connect to MySQL:', err);
  console.log('Starting without database (demo mode using in-memory fallback)...');
  setDbConnected(false);
  httpServer.listen(PORT, () => {
    console.log(`🛡️  SafeWatch TN Backend running on port ${PORT} (demo mode)`);
  });
});

export { io };
