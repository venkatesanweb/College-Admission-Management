import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api/axiosConfig';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (savedToken && savedUser) {
        const parsedUser = JSON.parse(savedUser);

        const parts = savedToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const expiry = payload.exp * 1000;
          if (Date.now() < expiry) {
            setToken(savedToken);
            setUser(parsedUser);
            const timeout = setTimeout(() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setToken(null);
              setUser(null);
            }, expiry - Date.now());
            setLoading(false);
            return () => clearTimeout(timeout);
          }
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (e) {
      console.error('Auth init error:', e);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await API.post('/auth/login', { email, password });
    const data = response.data.data;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setToken(data.token);
    setUser(data);
    return data;
  };

  const sendOtp = async (email) => {
    const response = await API.post('/auth/send-otp', { email });
    return response.data;
  };

  const register = async (fullName, email, password, phone, otp) => {
    const response = await API.post('/auth/register', { fullName, email, password, phone, otp });
    const data = response.data.data;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setToken(data.token);
    setUser(data);
    return data;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    sendOtp,
    logout,
    isAuthenticated: !!token,
    isStudent: user?.role === 'STUDENT',
    isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
