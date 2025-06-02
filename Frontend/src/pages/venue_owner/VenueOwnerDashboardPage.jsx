import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const VenueOwnerDashboardPage = () => {
  const { user } = useAuth();

  return (
    // Bu sahifa uchun ham alohida Layout (VenueOwnerLayout) yaratish maqsadga muvofiq
    <div className="container mx-auto p-6">
        <div className="bg-white shadow-md rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">To'yxona Egasi Boshqaruv Paneli</h1>
            <p className="text-gray-700 mb-6">Xush kelibsiz, <span className="font-semibold">{user?.fio || user?.username}</span>!</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link to="/owner/register-venue" className="block p-6 bg-teal-500 hover:bg-teal-600 text-white rounded-lg shadow-md transition-colors">
                <h2 className="text-xl font-semibold mb-2">Yangi To'yxona Qo'shish</h2>
                <p>Platformaga yangi to'yxonangizni ro'yxatdan o'tkazing.</p>
                </Link>
                <Link to="/owner/my-venues" className="block p-6 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg shadow-md transition-colors">
                <h2 className="text-xl font-semibold mb-2">Mening To'yxonalarim</h2>
                <p>Mavjud to'yxonalaringizni ko'rish va tahrirlash.</p>
                </Link>
                {/* /owner/bookings/:venueId kabi linklar bo'lishi mumkin */}
            </div>
        </div>
    </div>
  );
};

export default VenueOwnerDashboardPage;