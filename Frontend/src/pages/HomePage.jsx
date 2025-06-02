import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

// Filter komponentini AdminVenuesPage dagi bilan umumlashtirish mumkin
// import VenueFilterSortPublic from '../components/public/VenueFilterSortPublic';

const HomePage = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ // Foydalanuvchi filterlari [cite: 521]
    search: '',
    district_id: '',
    capacity_min: '',
    price_max: '',
    sort_by: 'v.name', // Default sort
    order: 'ASC'
  });

  // Tumanlar va boshqa filterlar uchun ma'lumotlarni backenddan olish kerak
  const districts = [{id: 1, name: 'Mirzo Ulugbek'}, /* ... */]; // Placeholder

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Backend GET /api/venues endpoint'i filterlarni qabul qilishi kerak [cite: 43]
      const response = await api.get('/venues', { params: filters });
      setVenues(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "To'yxonalarni yuklashda xatolik");
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

  return (
    <div> {/* MainLayout ichida bo'lgani uchun container va p-4 kerak emas */}
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Mavjud To'yxonalar</h1>
      
      {/* Filter va Sortlash Komponenti (VenueFilterSortPublic) */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">Saralash va Filterlash</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700">Qidiruv</label>
                <input type="text" name="search" id="search" value={filters.search}
                       onChange={(e) => handleFilterChange({ search: e.target.value })}
                       className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div>
                <label htmlFor="district_id" className="block text-sm font-medium text-gray-700">Tuman</label>
                <select name="district_id" id="district_id" value={filters.district_id}
                        onChange={(e) => handleFilterChange({ district_id: e.target.value })}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">Barchasi</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </div>
            {/* Sig'im va Narx uchun filterlar qo'shilishi mumkin */}
        </div>
      </div>

      {loading && <p className="text-center text-gray-600 py-4">Yuklanmoqda...</p>}
      {error && <p className="text-center text-red-500 py-4">{error}</p>}
      
      {!loading && !error && (
        venues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map(venue => (
              <div key={venue.venue_id} className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
                <img 
                    src={venue.main_image_url ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${venue.main_image_url}` : 'https://via.placeholder.com/400x250?text=To\'yxona'} 
                    alt={venue.name} 
                    className="w-full h-56 object-cover"
                />
                <div className="p-5">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{venue.name}</h3>
                  <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Manzil:</span> {venue.address}, {venue.district_name}</p>
                  <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Sig'imi:</span> {venue.capacity} kishi</p>
                  <p className="text-lg font-bold text-indigo-600 mb-3">{venue.price?.toLocaleString()} so'm / kishi</p>
                  <Link 
                    to={`/venues/${venue.venue_id}`}
                    className="inline-block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150"
                  >
                    Batafsil Ko'rish
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-10 text-xl">Hozircha to'yxonalar mavjud emas.</p>
        )
      )}
    </div>
  );
};

export default HomePage;