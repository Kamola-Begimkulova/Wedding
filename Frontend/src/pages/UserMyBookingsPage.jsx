import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext'; // user ma'lumotlarini olish uchun

const UserMyBookingsPage = () => {
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchMyBookings = useCallback(async () => {
    if (!user) return; // Foydalanuvchi tizimga kirmagan bo'lsa, so'rov yubormaslik
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/bookings/my-bookings'); //
      setMyBookings(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Bronlaringizni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyBookings();
  }, [fetchMyBookings]);

  const handleCancelMyBooking = async (bookingId) => {
    // API: PUT /api/bookings/:id/cancel (Klient roli bilan)
    if (window.confirm("Haqiqatan ham bu bronni bekor qilmoqchimisiz?")) {
        try {
            await api.put(`/bookings/${bookingId}/cancel`);
            alert("Broningiz muvaffaqiyatli bekor qilindi.");
            fetchMyBookings(); // Ro'yxatni yangilash
        } catch (err) {
            alert(err.response?.data?.message || "Bronni bekor qilishda xatolik.");
        }
    }
  };

  return (
    // MainLayout ichida
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mening Bronlarim</h1>

      {loading && <p className="text-center py-4">Yuklanmoqda...</p>}
      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md text-center">{error}</p>}

      {!loading && !error && (
        myBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100 text-gray-600 uppercase text-sm">
                <tr>
                  <th className="py-3 px-4 text-left">To'yxona Nomi</th>
                  <th className="py-3 px-4 text-left">Manzili</th>
                  <th className="py-3 px-4 text-left">Bron Sanasi</th>
                  <th className="py-3 px-4 text-center">Mehmonlar</th>
                  <th className="py-3 px-4 text-center">Statusi</th>
                  <th className="py-3 px-4 text-center">Amallar</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 text-sm">
                {myBookings.map(booking => ( // Backend javobida venue_name, venue_address, booking_date, number_of_guests, booking_status bo'ladi
                  <tr key={booking.booking_id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{booking.venue_name}</td>
                    <td className="py-3 px-4">{booking.venue_address}, {booking.district_name}</td>
                    <td className="py-3 px-4">{new Date(booking.booking_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-center">{booking.number_of_guests}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full
                        ${booking.booking_status === 'Tasdiqlangan' ? 'bg-green-100 text-green-700' :
                          booking.booking_status === 'Kutilmoqda' ? 'bg-yellow-100 text-yellow-700' :
                          booking.booking_status.startsWith('Bekor_qilingan') ? 'bg-red-100 text-red-700' :
                          booking.booking_status === 'Bo_lib_o_tgan' ? 'bg-blue-100 text-blue-700' : // "Bo'lib o'tgan" statusi uchun
                          'bg-gray-100 text-gray-700'}`}>
                        {booking.booking_status}
                      </span>
                    </td>
                     <td className="py-3 px-4 text-center">
                      {(booking.booking_status === 'Tasdiqlangan' || booking.booking_status === 'Kutilmoqda') &&
                        new Date(booking.booking_date) >= new Date().setHours(0,0,0,0) && ( // O'tib ketmagan bronlar
                          <button 
                            onClick={() => handleCancelMyBooking(booking.booking_id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Bekor qilish
                          </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-10 text-gray-500">Sizda hali aktiv bronlar mavjud emas.</p>
        )
      )}
    </div>
  );
};

// UserMyBookingsPage uchun marshrutni App.jsx ga qo'shish kerak:
// <Route path="/my-bookings" element={<ProtectedRoute allowedRoles={['Klient']}><MainLayout><UserMyBookingsPage /></MainLayout></ProtectedRoute>} />
// Yoki MainLayout ichidagi Outlet orqali:
// App.jsx da:
// <Route element={<MainLayout />}>
//   ...
//   <Route path="/my-bookings" element={<ProtectedRoute allowedRoles={['Klient']}><UserMyBookingsPage /></ProtectedRoute>} />
// </Route>
export default UserMyBookingsPage;