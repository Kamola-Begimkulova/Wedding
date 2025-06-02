import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

const VenueOwnerBookingsPage = () => {
  const { venueId } = useParams(); // Marshrutdan venueId ni olish
  const [bookings, setBookings] = useState([]);
  const [venueName, setVenueName] = useState(''); // To'yxona nomini ko'rsatish uchun
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVenueBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Birinchi navbatda to'yxona ma'lumotlarini (nomini) olishimiz mumkin
      // Yoki getBookingsForVenueOwner javobida to'yxona nomi ham bo'lishi kerak
      const venueDetailsResponse = await api.get(`/venues/${venueId}`); // Yoki /api/admin/venues/:id
      setVenueName(venueDetailsResponse.data.data?.name || `To'yxona #${venueId}`);

      const response = await api.get(`/bookings/venue-owner/${venueId}`); //
      setBookings(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Bronlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    fetchVenueBookings();
  }, [fetchVenueBookings]);
  
  const handleCancelBookingByOwner = async (bookingId) => {
    // API: PUT /api/bookings/:id/cancel (To_yxona_Egasi roli bilan)
    if (window.confirm("Haqiqatan ham bu bronni bekor qilmoqchimisiz?")) {
        try {
            await api.put(`/bookings/${bookingId}/cancel`);
            alert("Bron muvaffaqiyatli bekor qilindi.");
            fetchVenueBookings(); // Ro'yxatni yangilash
        } catch (err) {
            alert(err.response?.data?.message || "Bronni bekor qilishda xatolik.");
        }
    }
  };


  return (
    // VenueOwnerLayout ichida
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">"{venueName}" uchun Bronlar</h1>
      <p className="text-sm text-gray-500 mb-6">To'yxona ID: {venueId}</p>

      {loading && <p className="text-center py-4">Yuklanmoqda...</p>}
      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md text-center">{error}</p>}

      {!loading && !error && (
        bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100 text-gray-600 uppercase text-sm">
                <tr>
                  <th className="py-3 px-4 text-left">Bron ID</th>
                  <th className="py-3 px-4 text-left">Klient (FIO / Tel)</th>
                  <th className="py-3 px-4 text-left">Bron Sanasi</th>
                  <th className="py-3 px-4 text-center">Mehmonlar soni</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Amallar</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 text-sm">
                {bookings.map(booking => ( // Backend javobi client_fio, client_phone, booking_date, number_of_guests, booking_status ni o'z ichiga oladi
                  <tr key={booking.booking_id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{booking.booking_id}</td>
                    <td className="py-3 px-4">{booking.client_fio} ({booking.client_phone})</td>
                    <td className="py-3 px-4">{new Date(booking.booking_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-center">{booking.number_of_guests}</td>
                    <td className="py-3 px-4 text-center">
                       <span className={`px-2 py-1 text-xs font-semibold rounded-full
                        ${booking.booking_status === 'Tasdiqlangan' ? 'bg-green-100 text-green-700' :
                          booking.booking_status === 'Kutilmoqda' ? 'bg-yellow-100 text-yellow-700' :
                          booking.booking_status.startsWith('Bekor_qilingan') ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'}`}>
                        {booking.booking_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {(booking.booking_status === 'Tasdiqlangan' || booking.booking_status === 'Kutilmoqda') &&
                        new Date(booking.booking_date) >= new Date().setHours(0,0,0,0) && ( // O'tib ketmagan bronlar
                          <button 
                            onClick={() => handleCancelBookingByOwner(booking.booking_id)}
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
          <p className="text-center py-10 text-gray-500">Bu to'yxona uchun bronlar mavjud emas.</p>
        )
      )}
    </div>
  );
};

export default VenueOwnerBookingsPage;