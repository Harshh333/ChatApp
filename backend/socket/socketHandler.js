const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

function socketHandler(io) {
  // ============ AUTH MIDDLEWARE FOR SOCKET ============
  // Har naye socket connection pe ye check karega ki valid token hai ya nahi
  // Ye Express middleware jaisa hi hai, bas socket.io ke liye
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication token nahi mila'));

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Invalid token'));
      socket.userId = decoded.userId;
      // socket object ke saath userId attach kar diya - ab hume pura request
      // cycle me pata rahega ki YE connection kis user ka hai
      next();
    });
  });

  // ============ MAIN CONNECTION EVENT ============
  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // User ko "online" mark karna DB me
    await User.findByIdAndUpdate(socket.userId, { isOnline: true });

    // Baaki sabko batao ki ye user online ho gaya
    // broadcast se sabko jaata hai EXCEPT khud isi socket ko
    socket.broadcast.emit('user-online', { userId: socket.userId });

    // ---- Room join karna ----
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      // socket.join() ek "channel" join karne jaisa hai
      // ab is socket ko sirf isi room ke messages milenge
      console.log(`User ${socket.userId} joined room ${roomId}`);
    });

    // ---- Room chhodna ----
    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
    });

    // ---- Naya message bhejna ----
    socket.on('send-message', async ({ roomId, text }) => {
      try {
        // 1. Message ko DB me save karo (taaki history rahe)
        const message = new Message({
          room: roomId,
          sender: socket.userId,
          text,
        });
        await message.save();
        await message.populate('sender', 'username');

        // 2. Sabko is room me broadcast karo (khud ko bhi, isliye io.to use kiya, socket.broadcast nahi)
        io.to(roomId).emit('receive-message', message);
      } catch (err) {
        socket.emit('error-message', { message: 'Message bhejne me error aaya' });
      }
    });

    // ---- Typing indicator (bonus feature - "Rahul is typing...") ----
    socket.on('typing', ({ roomId, username }) => {
      socket.to(roomId).emit('user-typing', { username });
      // socket.to() = broadcast except sender, but sirf usi room me
    });

    // ---- Disconnect hone par ----
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
      });
      socket.broadcast.emit('user-offline', { userId: socket.userId });
    });
  });
}

module.exports = socketHandler;
