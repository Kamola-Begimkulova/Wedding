import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal'; // Agar status o'zgartirish uchun modal kerak bo'lsa

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    venue_id: '', district_id: '', status_id: '', client_search: '',
    date_from: '', date_to: '', sort_by: 'b.booking_date', order: 'DESC'
  });

  // Filterlar uchun ma'lumotlar (dinamik yuklanishi mumkin)
  const [venuesList, setVenuesList] = useState([]); // Barcha to'yxonalar (filter uchun)
  const [districtsList, setDistrictsList] = useState([]); // Barcha tumanlar
  const [bookingStatusesList, setBookingStatusesList] = useState([]); // Bron statuslari

  const fetchFilterData = useCallback(async () => {
    try {
        // Namuna: Bu endpointlar mavjud deb faraz qilamiz
        // const venuesRes = await api.get('/admin/venues', { params: { limit: 1000 } }); // Barcha to'yxonalar
        // setVenuesList(venuesRes.data.data || []);
        // const districtsRes = await api.get('/districts');
        // setDistrictsList(districtsRes.data.data || []);
        // const statusesRes = await api.get('/booking-statuses'); // Agar shunday endpoint bo'lsa
        // setBookingStatusesList(statusesRes.data.data || []);
        
        // Hozircha statik ma'lumotlar
         setBookingStatusesList([
            { status_id: 1, status_name: 'Kutilmoqda' }, // IDlar DBdagiga mos kelishi kerak
            { status_id: 2, status_name: 'Tasdiqlangan' },
            { status_id: 3, status_name: 'Bekor_qilingan_klient' },
            { status_id: 4, status_name: 'Bekor_qilingan_egasi' },
            { status_id: 5, status_name: 'Bekor_qilingan_admin' },
            { status_id: 6, status_name: 'Bo_lib_o_tgan' },
            { status_id: 7, status_name: 'Kelmagan' }, // Misol uchun
        ]);

    } catch (err) {
        console.error("Filter ma'lumotlarini yuklashda xatolik:", err);
    }
  }, []);


  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const validFilters = Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '' && value !== null)
      );
      const response = await api.get('/bookings/admin/all', { params: validFilters }); //
      setBookings(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Bronlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFilterData();
    fetchBookings();
  }, [fetchFilterData, fetchBookings]);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdateBookingStatus = async (bookingId, newStatusName) => {
    if (!newStatusName) {
        alert("Iltimos, yangi statusni tanlang.");
        return;
    }
    // API: PUT /api/bookings/admin/:bookingId/status
    // Body: { new_status_name: "Tasdiqlangan" }
    if (window.confirm(`Haqiqatan ham bu bron statusini "${newStatusName}" ga o'zgartirmoqchimisiz?`)) {
        try {
            const response = await api.put(`/bookings/admin/${bookingId}/status`, { new_status_name: newStatusName });
            if (response.data.success) {
                alert("Bron statusi muvaffaqiyatli yangilandi!");
                fetchBookings();
            } else {
                alert(response.data.message || "Statusni o'zgartirishda xatolik.");
            }
        } catch (err) {
            alert(err.response?.data?.message || "Server xatoligi.");
        }
    }
  };
  
  const handleCancelBookingByAdmin = async (bookingId) => {
    // API: PUT /api/bookings/:id/cancel (Admin roli bilan)
    if (window.confirm("Haqiqatan ham bu bronni bekor qilmoqchimisiz?")) {
        try {
            await api.put(`/bookings/${bookingId}/cancel`);
            alert("Bron muvaffaqiyatli admin tomonidan bekor qilindi.");
            fetchBookings();
        } catch (err) {
            alert(err.response?.data?.message || "Bronni bekor qilishda xatolik.");
        }
    }
  };

  return (
    <div className="p-6 bg-white shadow-xl rounded-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">Barcha Bronlarni Boshqarish</h1>
      
      {/* Filters UI */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label htmlFor="client_search" className="block text-sm font-medium text-gray-700">Klient (FIO/Tel)</label>
          <input type="text" name="client_search" id="client_search" value={filters.client_search} onChange={handleFilterChange}
                 className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm"/>
        </div>
        <div>
          <label htmlFor="status_id" className="block text-sm font-medium text-gray-700">Bron Statusi</label>
          <select name="status_id" id="status_id" value={filters.status_id} onChange={handleFilterChange}
                  className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm bg-white">
            <option value="">Barchasi</option>
            {bookingStatusesList.map(s => <option key={s.status_id} value={s.status_id}>{s.status_name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="date_from" className="block text-sm font-medium text-gray-700">Sana (dan)</label>
          <input type="date" name="date_from" id="date_from" value={filters.date_from} onChange={handleFilterChange}
                 className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm"/>
        </div>
        <div>
          <label htmlFor="date_to" className="block text-sm font-medium text-gray-700">Sana (gacha)</label>
          <input type="date" name="date_to" id="date_to" value={filters.date_to} onChange={handleFilterChange}
                 className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm"/>
        </div>
        {/* Boshqa filterlar: venue_id, district_id, sort_by, order */}
      </div>

      {loading && <p className="text-center py-5">Bronlar yuklanmoqda...</p>}
      {error && <p className="text-center py-5 text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      
      {!loading && !error && (
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <tr>
                <th className="py-3 px-4 text-left">ID</th>
                <th className="py-3 px-4 text-left">To'yxona</th>
                <th className="py-3 px-4 text-left">Klient (FIO/Tel)</th>
                <th className="py-3 px-4 text-left">Sana</th>
                <th className="py-3 px-4 text-center">Mehmonlar</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Amallar</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {bookings.length > 0 ? bookings.map(booking => (
                // Backend javobida venue_name, client_fio, client_phone, booking_date, number_of_guests, booking_status bo'ladi
                <tr key={booking.booking_id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4">{booking.booking_id}</td>
                  <td className="py-3 px-4">{booking.venue_name}</td>
                  <td className="py-3 px-4">{booking.client_fio} ({booking.client_phone})</td>
                  <td className="py-3 px-4">{new Date(booking.booking_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-center">{booking.number_of_guests}</td>
                  <td className="py-3 px-4 text-center">
                     <select 
                        value={booking.booking_status} // Bu yerda status_name yoki status_id bo'lishi kerak
                                                        // Agar status_id bo'lsa, booking.status_id_val ni ishlatish
                        onChange={(e) => handleUpdateBookingStatus(booking.booking_id, e.target.value)}
                        className={`p-1 rounded text-xs border
                            ${booking.booking_status === 'Tasdiqlangan' ? 'bg-green-100 border-green-300 text-green-700' :
                              booking.booking_status === 'Kutilmoqda' ? 'bg-yellow-100 border-yellow-300 text-yellow-700' :
                              booking.booking_status.startsWith('Bekor_qilingan') ? 'bg-red-100 border-red-300 text-red-700' :
                              'bg-gray-100 border-gray-300 text-gray-700'}`}
                    >
                        {bookingStatusesList.map(s => <option key={s.status_id} value={s.status_name}>{s.status_name}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {(booking.booking_status === 'Tasdiqlangan' || booking.booking_status === 'Kutilmoqda') && (
                        <button 
                            onClick={() => handleCancelBookingByAdmin(booking.booking_id)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium"
                        >
                            Bekor qilish
                        </button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="text-center py-10 text-gray-500">Bronlar topilmadi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminBookingsPage;