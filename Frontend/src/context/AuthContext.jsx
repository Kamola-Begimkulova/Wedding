import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      // Ideal holda, token bilan foydalanuvchi ma'lumotlarini backenddan qayta yuklash kerak
      // Masalan, /api/auth/me kabi endpoint orqali
      // Hozircha, soddalik uchun, agar token bo'lsa, foydalanuvchini "yuklangan" deb hisoblaymiz
      // Backend `protect` middleware foydalanuvchi ma'lumotlarini `req.user`ga yuklaydi
      // Frontendda ham shunga o'xshash mexanizm kerak bo'ladi.
      // Vaqtincha: token parse qilib user role ni olish mumkin yoki serverdan olish kerak.
      // Quyida soddalashtirilgan variant, to'liq implementatsiya uchun JWTni decode qilish kerak.
      // Yoki serverga /api/auth/profile so'rovini yuborib user ma'lumotlarini olish kerak.
      // Biz soddalik uchun user state'ni to'liq to'ldirmaymiz.
      // Login qilganda keladigan user ma'lumotlarini saqlaymiz.
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      setLoading(true);
      // Backenddagi login uchun endpoint: POST /api/auth/login [cite: 18]
      const response = await api.post('/auth/login', { username, password });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        // Backend login javobida foydalanuvchi ma'lumotlari (role_name bilan) keladi
        setUser(response.data.user);
        setLoading(false);
        // Foydalanuvchi rolini tekshirib, mos sahifaga yo'naltirish
        if (response.data.user.role_name === 'Admin') {
          navigate('/admin/dashboard');
        } else if (response.data.user.role_name === 'To_yxona_Egasi') {
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
      // Xatolikni ko'rsatish kerak (masalan, toast notification bilan)
      alert(error.response?.data?.message || error.message || 'Login failed');
    }
  };

  const register = async (userData) => {
    try {
        setLoading(true);
        // Backenddagi registratsiya uchun endpoint: POST /api/auth/register [cite: 18]
        const response = await api.post('/auth/register', userData); // userData: { fio, username, password, phone_number } [cite: 220]
        if (response.data.success) {
            localStorage.setItem('token', response.data.token);
            setToken(response.data.token);
            setUser(response.data.user); // Registratsiya javobida ham foydalanuvchi ma'lumotlari keladi
            setLoading(false);
            navigate('/'); // Asosiy sahifaga yo'naltirish
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