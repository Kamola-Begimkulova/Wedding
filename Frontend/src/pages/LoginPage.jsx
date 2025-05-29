import React, { useState, useContext } from 'react'; // React ni import qilish
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
// import './AuthPage.css'; // App.jsx da import qilingan

const LoginPage = () => {
  const { setUser, API_BASE_URL } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { username, password });
      if (response.data && response.data.success) {
        setUser({
          token: response.data.token,
          role: response.data.user.role_name,
          fio: response.data.user.fio,
          username: response.data.user.username,
          userId: response.data.user.user_id
        });
        if (response.data.user.role_name === 'Admin') navigate('/dashboard/admin');
        else if (response.data.user.role_name === 'To_yxona_Egasi') navigate('/dashboard/owner');
        else navigate('/');
      } else {
        setError(response.data.message || "Login qilishda noma'lum xatolik.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Server bilan bog'lanishda xatolik.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Tizimga Kirish</h2>
        {error && <p className="error-text">{error}</p>}
        <div className="form-group">
          <label htmlFor="username">Login (username):</label>
          <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Parol:</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Kirilmoqda...' : 'Kirish'}
        </button>
        <p className="auth-switch">
          Hisobingiz yo'qmi? <Link to="/register">Ro'yxatdan o'tish</Link>
        </p>
      </form>
    </div>
  );
};
export default LoginPage;