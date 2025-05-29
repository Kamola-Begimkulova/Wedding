import React, { useState, useContext } from 'react'; // React ni import qilish
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
// import './AuthPage.css'; // App.jsx da import qilingan

const RegisterPage = () => {
  const { setUser, API_BASE_URL } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ fio: '', username: '', password: '', phone_number: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, formData);
      if (response.data && response.data.success) {
         setUser({
          token: response.data.token,
          role: 'Klient',
          fio: response.data.user.fio,
          username: response.data.user.username,
          userId: response.data.user.user_id
        });
        navigate('/');
      } else {
        setError(response.data.message || "Ro'yxatdan o'tishda noma'lum xatolik.");
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
        <h2>Ro'yxatdan O'tish</h2>
        {error && <p className="error-text">{error}</p>}
        <div className="form-group"><label htmlFor="fioReg">F.I.O:</label><input type="text" name="fio" id="fioReg" value={formData.fio} onChange={handleChange} required /></div>
        <div className="form-group"><label htmlFor="usernameReg">Login (username):</label><input type="text" name="username" id="usernameReg" value={formData.username} onChange={handleChange} required /></div>
        <div className="form-group"><label htmlFor="passwordReg">Parol:</label><input type="password" name="password" id="passwordReg" value={formData.password} onChange={handleChange} required /></div>
        <div className="form-group"><label htmlFor="phone_numberReg">Telefon raqam:</label><input type="tel" name="phone_number" id="phone_numberReg" value={formData.phone_number} onChange={handleChange} required placeholder="+998XXYYYYYYY" /></div>
        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Yuborilmoqda...' : "Ro'yxatdan o'tish"}
        </button>
        <p className="auth-switch">
          Hisobingiz bormi? <Link to="/login">Tizimga kirish</Link>
        </p>
      </form>
    </div>
  );
};
export default RegisterPage;