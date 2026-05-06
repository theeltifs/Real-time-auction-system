import axios from 'axios';
import { createContext, useState, useEffect } from 'react';
export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [role, setRole] = useState('');

  useEffect(() => {
    if (!token) { setRole(''); return; }
    axios.get('http://localhost:5000/api/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setRole(res.data.role))
      .catch(() => {
        localStorage.removeItem('token');
        setToken('');
        setRole('');
      });
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setRole('');
  };

  const loginWithGoogle = async (tokenId) => {
    const res = await axios.post('http://localhost:5000/api/auth/google', { tokenId });
    const newToken = res.data.token;
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  return (
    <AuthContext.Provider value={{ token, role, login, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};
