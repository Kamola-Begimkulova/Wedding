import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const AdminDashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Admin Boshqaruv Paneli</h1>
      <p className="text-gray-700 mb-6">Xush kelibsiz, <span className="font-semibold">{user?.fio || user?.username}</span>!</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/admin/venues" className="block p-6 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition-colors">
          <h2 className="text-xl font-semibold mb-2">To'yxonalarni Boshqarish</h2>
          <p>Yangi to'yxonalar qo'shish, tahrirlash va tasdiqlash.</p>
        </Link>
        <Link to="/admin/users" className="block p-6 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition-colors">
          <h2 className="text-xl font-semibold mb-2">Foydalanuvchilarni Boshqarish</h2>
          <p>Foydalanuvchilarni ko'rish, rollarini o'zgartirish.</p>
        </Link>
        <Link to="/admin/bookings" className="block p-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md transition-colors">
          <h2 className="text-xl font-semibold mb-2">Bronlarni Ko'rish</h2>
          <p>Barcha bronlarni kuzatish va boshqarish.</p>
        </Link>
        {/* Boshqa muhim bo'limlarga tezkor havolalar */}
      </div>
    </div>
  );
};

export default AdminDashboardPage;