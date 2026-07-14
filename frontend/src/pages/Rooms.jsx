import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);
  // Empty array [] ka matlab - ye sirf ek baar chalega jab component pehli
  // baar screen pe aayega (mount hoga)

  async function fetchRooms() {
    try {
      const res = await api.get('/rooms/my-rooms');
      setRooms(res.data);
    } catch (err) {
      console.error('Rooms fetch nahi hue', err);
    }
  }

  async function handleCreateRoom(e) {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    try {
      await api.post('/rooms/create', { name: newRoomName });
      setNewRoomName('');
      fetchRooms(); // list refresh karo naya room dikhane ke liye
    } catch (err) {
      console.error('Room create nahi hua', err);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="rooms-container">
      <div className="rooms-header">
        <h2>Hi, {user?.username}</h2>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      <form onSubmit={handleCreateRoom} className="create-room-form">
        <input
          type="text"
          placeholder="Naya room ka naam"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
        />
        <button type="submit">+ Create Room</button>
      </form>

      <div className="room-list">
        {rooms.length === 0 && <p>Koi room nahi hai. Naya banao!</p>}
        {rooms.map((room) => (
          <div
            key={room._id}
            className="room-card"
            onClick={() => navigate(`/chat/${room._id}`, { state: { roomName: room.name } })}
          >
            {room.name}
          </div>
        ))}
      </div>
    </div>
  );
}
