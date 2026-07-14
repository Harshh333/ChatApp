import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/axios';

export default function Chat() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const roomName = location.state?.roomName || 'Chat';

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  // Set use kar rahe hain kyunki ismein duplicate userId add nahi honge
  // aur "has" check O(1) me hota hai (array.includes se fast)

  const socketRef = useRef(null);
  // useRef - socket instance ko store karne ke liye jo re-render pe reset na ho
  const messagesEndRef = useRef(null);
  // ye auto-scroll ke liye use hoga

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    // 1. Pehle purana message history fetch karo (REST API se)
    fetchHistory();

    // 2. Socket connection banao - token ke saath (auth ke liye)
    const socket = io('http://localhost:5000', {
      auth: { token: localStorage.getItem('token') },
    });
    socketRef.current = socket;

    // 3. Is room ko join karo
    socket.emit('join-room', roomId);

    // 4. Naya message aane par listen karo
    socket.on('receive-message', (message) => {
      setMessages((prev) => [...prev, message]);
      // prev state use karna zaroori hai - purane messages pe naya add karne ke liye
    });

    // 5. Typing indicator sunna
    socket.on('user-typing', ({ username }) => {
      setTypingUser(username);
      // 2 second baad "typing..." hata do
      setTimeout(() => setTypingUser(''), 2000);
    });

    // 6. Online/offline events sunna
    socket.on('user-online', ({ userId }) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
      // naya Set banate hain (purane ko mutate nahi karte) - React ko pata
      // chale ki state badli hai, warna re-render nahi hoga
    });

    socket.on('user-offline', ({ userId }) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    });

    // CLEANUP - jab component hatega (user page chhodega) tab ye chalega
    // Bahut zaroori hai, warna purane connections khule reh jayenge (memory leak)
    return () => {
      socket.emit('leave-room', roomId);
      socket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    // Har naye message pe neeche scroll kar do
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchHistory() {
    try {
      const res = await api.get(`/rooms/${roomId}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error('History fetch nahi hui', err);
    }
  }

  function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    socketRef.current.emit('send-message', { roomId, text });
    // Note: hum yaha khud se setMessages nahi kar rahe -
    // server hi 'receive-message' event bhejega, jisse hume bhi milega
    setText('');
  }

  function handleTyping() {
    socketRef.current.emit('typing', { roomId, username: currentUser?.username });
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button onClick={() => navigate('/rooms')}>&larr; Back</button>
        <h3>{roomName}</h3>
      </div>

      <div className="messages-area">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`message ${msg.sender?._id === currentUser?.id ? 'own' : 'other'}`}
          >
            <span className="sender-name">
              {onlineUsers.has(msg.sender?._id) && <span className="online-dot" />}
              {msg.sender?.username}
            </span>
            <p>{msg.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {typingUser && <p className="typing-indicator">{typingUser} type kar raha hai...</p>}

      <form onSubmit={handleSend} className="message-input-form">
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
          placeholder="Message likho..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
