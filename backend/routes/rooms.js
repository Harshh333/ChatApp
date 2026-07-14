const express = require('express');
const Room = require('../models/Room');
const Message = require('../models/Message');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// Naya room banana
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    const room = new Room({
      name,
      members: [req.userId],
      createdBy: req.userId,
    });
    await room.save();
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Saare rooms ki list (jisme user hai)
router.get('/my-rooms', verifyToken, async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.userId });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Existing room join karna
router.post('/:roomId/join', verifyToken, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room nahi mila' });

    // Agar already member hai to dobara add mat karo
    if (!room.members.includes(req.userId)) {
      room.members.push(req.userId);
      await room.save();
    }
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Room ka purana message history laana (jab user room open kare)
router.get('/:roomId/messages', verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.roomId })
      .populate('sender', 'username')
      // populate -> sender ki ObjectId ki jagah uska actual username bhi mil jayega
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
