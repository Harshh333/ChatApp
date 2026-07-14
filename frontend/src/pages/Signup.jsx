import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/signup', { username, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1000);
      // Signup ke baad thoda ruk ke login page pe bhej do
    } catch (err) {
      setError(err.response?.data?.message || 'Signup fail ho gaya');
    }
  }

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Signup</h2>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">Signup ho gaya! Login page pe bhej rahe hain...</p>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Signup</button>
        <p>
          Already account hai? <Link to="/login">Login karo</Link>
        </p>
      </form>
    </div>
  );
}
