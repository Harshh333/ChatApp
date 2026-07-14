import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

// Custom hook - isse hum har component me easily useAuth() call kar payenge
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  // localStorage se initial state uthate hain - taaki page refresh hone par
  // user logout na ho jaaye
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  function login(token, userData) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
