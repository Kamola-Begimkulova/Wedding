import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';

const Navbar = () => {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">To'yXona</Link>
      </div>
      <ul className="navbar-links">
        <li><Link to="/">Asosiy</Link></li>
        {user ? (
          <>
            {user.role === 'Admin' && <li><Link to="/dashboard/admin">Admin Panel</Link></li>}
            {user.role === 'To_yxona_Egasi' && <li><Link to="/dashboard/owner">Ega Paneli</Link></li>}
            {(user.role === 'Klient' || user.role === 'Admin') && <li><Link to="/dashboard/client">Mening Bronlarim</Link></li>}
            <li><span className="navbar-user">Salom, {user.fio || user.username}!</span></li>
            <li><button onClick={handleLogout} className="navbar-button logout-button">Chiqish</button></li>
          </>
        ) : (
          <>
            <li><Link to="/login" className="navbar-button">Kirish</Link></li>
            <li><Link to="/register" className="navbar-button register-button">Ro'yxatdan o'tish</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};
export default Navbar;