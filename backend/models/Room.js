const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // ref: 'User' matlab -> ye ID actually User collection ka document point karti hai
    // isse hum baad me room.populate('members') karke pura user data nikal sakte hain
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
