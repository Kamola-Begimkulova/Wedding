import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-2xl font-bold hover:text-gray-200 transition-colors">
          To'yxonaBron
        </Link>
        <div className="space-x-4">
          <Link to="/" className="text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
            Asosiy
          </Link>
          
          {isAuthenticated ? (
            <>
              {user?.role_name === 'Admin' && (
                <Link to="/admin/dashboard" className="text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Admin Panel
                </Link>
              )}
              {user?.role_name === 'To_yxona_Egasi' && (
                <Link to="/owner/dashboard" className="text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  To'yxona Egasi Paneli
                </Link>
              )}
               {/* Foydalanuvchi uchun "Mening Bronlarim" kabi linklar qo'shilishi mumkin */}
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Chiqish ({user?.username})
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Kirish
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;