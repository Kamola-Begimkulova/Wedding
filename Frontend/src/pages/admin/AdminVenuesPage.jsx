import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import VenueFilterSort from '../../components/admin/VenueFilterSort'; // Filter komponenti
// import VenueTable from '../../components/admin/VenueTable'; // Jadval komponenti (alohida yaratilishi mumkin)

const AdminVenuesPage = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    district_id: '',
    status_name: '', // Backend 'Tasdiqlangan', 'Kutilmoqda', 'Rad_etilgan' kabi status nomlarini kutadi
    sort_by: 'v.created_at', // Backend 'v.name', 'v.price', 'v.capacity', 'v.created_at' va hk. kutadi [cite: 155]
    order: 'DESC', // 'ASC' yoki 'DESC' [cite: 155]
    // Boshqa filterlar: capacity_min, capacity_max, price_min, price_max [cite: 143]
  });

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Backenddagi admin uchun to'yxonalarni olish endpointi: GET /api/admin/venues [cite: 3, 143]
      // Bu endpoint filter va sortlash parametrlarini qabul qiladi [cite: 143]
      const response = await api.get('/admin/venues', { params: filters });
      setVenues(response.data.data || []); // Backend count va data qaytaradi [cite: 157]
    } catch (err) {
      setError(err.response?.data?.message || err.message || "To'yxonalarni yuklashda xatolik");
      console.error("Fetch venues error:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  // Kerakli tumanlar va statuslar ro'yxatini backenddan yoki statik ravishda olish mumkin
  // Masalan, /api/districts, /api/venue-statuses endpointlari orqali
  const districts = [ {id: 1, name: 'Mirzo Ulugbek'}, {id: 2, name: 'Chilonzor'} /* ... */]; // Namuna uchun
  const venueStatuses = [ {id: 'Tasdiqlangan', name: 'Tasdiqlangan'}, {id: 'Kutilmoqda', name: 'Kutilmoqda'}, /* ... */]; // Namuna uchun [cite: 161]


  // TODO: To'yxona qo'shish, o'zgartirish, o'chirish uchun UI va funksionallik qo'shish
  // Yangi to'yxona qo'shish: Adminning 1-punkti [cite: 522] -> POST /api/venues (Admin uchun) [cite: 17, 46] yoki /api/admin/venues
  // To'yxonani o'chirish: Adminning 5-punkti [cite: 524] -> DELETE /api/venues/:id (Admin uchun) [cite: 16, 49]
  // To'yxonani o'zgartirish: Adminning 6-punkti [cite: 524] -> PUT /api/admin/venues/:id [cite: 14, 185]

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">To'yxonalarni Boshqarish (Admin)</h1>
      
      <VenueFilterSort 
        filters={filters} 
        onFilterChange={handleFilterChange}
        districts={districts} /* Buni backenddan olish kerak bo'ladi */
        venueStatuses={venueStatuses} /* Buni backenddan olish kerak bo'ladi */
      />

      {loading && <p className="text-center text-gray-600 py-4">Yuklanmoqda...</p>}
      {error && <p className="text-center text-red-500 py-4 bg-red-100 border border-red-500 rounded-md">{error}</p>}
      
      {!loading && !error && (
        <div className="overflow-x-auto shadow-md rounded-lg mt-6">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="py-3 px-4 text-left">ID</th>
                <th className="py-3 px-4 text-left">Nomi</th>
                <th className="py-3 px-4 text-left">Manzil</th>
                <th className="py-3 px-4 text-left">Tuman</th>
                <th className="py-3 px-4 text-left">Sig'imi</th>
                <th className="py-3 px-4 text-left">Narxi (1 o'rindiq)</th>
                <th className="py-3 px-4 text-left">Statusi</th>
                {/* Backenddan keladigan owner_fio, owner_phone ham qo'shilishi mumkin [cite: 144] */}
                <th className="py-3 px-4 text-left">Amallar</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {venues.length > 0 ? venues.map((venue, index) => (
                <tr key={venue.venue_id} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                  <td className="py-3 px-4">{venue.venue_id}</td>
                  <td className="py-3 px-4 font-medium">{venue.name}</td>
                  <td className="py-3 px-4">{venue.address}</td>
                  <td className="py-3 px-4">{venue.district_name}</td>
                  <td className="py-3 px-4 text-center">{venue.capacity}</td>
                  <td className="py-3 px-4 text-right">{venue.price?.toLocaleString()} so'm</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full
                      ${venue.status_name === 'Tasdiqlangan' ? 'bg-green-100 text-green-700' :
                        venue.status_name === 'Kutilmoqda' ? 'bg-yellow-100 text-yellow-700' :
                        venue.status_name === 'Rad_etilgan' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'}`}>
                      {venue.status_name}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-blue-600 hover:text-blue-800 mr-2">👁️ Ko'rish</button>
                    <button className="text-yellow-600 hover:text-yellow-800 mr-2">✏️ Tahrirlash</button>
                    <button className="text-red-600 hover:text-red-800">🗑️ O'chirish</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-gray-500">To'yxonalar topilmadi.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* TODO: Pagination qo'shish agar kerak bo'lsa */}
    </div>
  );
};

export default AdminVenuesPage;