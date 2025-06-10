import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom'; // Tahrirlash va bronlarni ko'rish uchun

const VenueOwnerMyVenuesPage = () => {
  const [myVenues, setMyVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMyVenues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/venues/my-venues/list'); // [cite: 47, 449]
      setMyVenues(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "To'yxonalaringizni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyVenues();
  }, [fetchMyVenues]);

  return (
    // VenueOwnerLayout ichida bo'lishi kerak
    <div className="p-6 bg-white shadow-md rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mening To'yxonalarim</h1>
        <Link to="/owner/register-venue" className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md">
          + Yangi To'yxona Qo'shish
        </Link>
      </div>

      {loading && <p className="text-center py-4">Yuklanmoqda...</p>}
      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md text-center">{error}</p>}

      {!loading && !error && (
        myVenues.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100 text-gray-600 uppercase text-sm">
                <tr>
                  <th className="py-3 px-4 text-left">Nomi</th>
                  <th className="py-3 px-4 text-left">Manzil</th>
                  <th className="py-3 px-4 text-center">Statusi</th>
                  <th className="py-3 px-4 text-center">Amallar</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 text-sm">
                {myVenues.map(venue => (
                  <tr key={venue.venue_id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{venue.name}</td>
                    <td className="py-3 px-4">{venue.address}, {venue.district_name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full
                        ${venue.venue_status === 'Tasdiqlangan' ? 'bg-green-100 text-green-700' :
                          venue.venue_status === 'Kutilmoqda' ? 'bg-yellow-100 text-yellow-700' :
                          venue.venue_status === 'Rad_etilgan' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'}`}>
                        {venue.venue_status} 
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link to={`/owner/edit-venue/${venue.venue_id}`} className="text-blue-600 hover:text-blue-800 mr-3 text-sm font-medium">Tahrirlash</Link>
                      <Link to={`/owner/venue-bookings/${venue.venue_id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Bronlar</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-10 text-gray-500">Sizda hali to'yxonalar mavjud emas.</p>
        )
      )}
    </div>
  );
};
// To'yxona egasining "2. To’yxonasining ma’lumotlarini o’zgartirish" [cite: 535] uchun
// `/owner/edit-venue/:venueId` route va sahifasi yaratilishi kerak.
// API: PUT /api/venues/:id (bu egasining o'z to'yxonasini tahrirlashiga ruxsat beradi).
// VenueForm komponentini qayta ishlatish mumkin.
export default VenueOwnerMyVenuesPage;