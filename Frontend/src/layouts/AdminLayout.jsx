import React from 'react';
import Navbar from '../components/common/Navbar'; // Yoki maxsus AdminNavbar
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom'; 

const AdminLayout = () => {
  const { user } = useAuth();

  console.log("AdminLayout user:", user);
  if (user?.role_name !== 'Admin') {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar /> {/* Navbar user rolini tekshirib, Admin linklarini ko'rsatadi */}
      <div className="flex-grow container mx-auto p-4 flex">
        <aside className="w-1/4 pr-4">
          <nav className="bg-white shadow-md rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Admin Navigatsiyasi</h3>
            <ul>
              <li><Link to="/admin/dashboard" className="block py-2 px-3 text-gray-600 hover:bg-gray-100 rounded">Boshqaruv Paneli</Link></li>
              <li><Link to="/admin/venues" className="block py-2 px-3 text-gray-600 hover:bg-gray-100 rounded">To'yxonalar</Link></li>
              <li><Link to="/admin/users" className="block py-2 px-3 text-gray-600 hover:bg-gray-100 rounded">Foydalanuvchilar</Link></li>
              <li><Link to="/admin/bookings" className="block py-2 px-3 text-gray-600 hover:bg-gray-100 rounded">Bronlar</Link></li>
              {/* Boshqa admin linklari */}
            </ul>
          </nav>
        </aside>
        <main className="w-3/4">
          <Outlet />
        </main>
      </div>
      <footer className="bg-gray-800 text-white text-center p-4">
        Admin Panel Footer
      </footer>
    </div>
  );
};

export default AdminLayout;