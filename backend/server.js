const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const socketHandler = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);
// Socket.io ko Express server ke upar attach karte hain, alag server nahi banate

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    // React app (Vite default port 5173) se requests allow karne ke liye
    methods: ['GET', 'POST'],
  },
});

// ---- Middleware ----
app.use(cors());
app.use(express.json());
// express.json() -> req.body me JSON data parse karne ke liye zaroori hai

// ---- Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// ---- Socket.io ----
socketHandler(io);
console.log("URI:", process.env.MONGO_URI);

// ---- MongoDB Connection ----
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
