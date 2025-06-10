import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', { username, password });

      if (response.data.success) {
        const { token, user } = response.data;
        console.log("Login successful:", user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        setToken(token);
        setUser(user);
        setLoading(false);

        if (user.role_name == 'Admin') {
          navigate('/admin/dashboard');
        } else if (user.role_name == 'Tuyxona_Egasi') {
          navigate('/owner/dashboard');
        } else {
          navigate('/');
        }
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      setLoading(false);
      console.error("Login error:", error);
      alert(error.response?.data?.message || error.message || 'Login failed');
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/register', userData);

      if (response.data.success) {
        const { token, user } = response.data;
        navigate('/login');
        setToken(token);
        setUser(user);
        setLoading(false);

        navigate('/');
        alert('Muvaffaqiyatli ro\'yxatdan o\'tdingiz!');
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      setLoading(false);
      console.error("Registration error:", error);
      alert(error.response?.data?.message || error.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, loading, isAuthenticated: !!token }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
