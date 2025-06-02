import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { Search, MapPin, Users, DollarSign, Filter, X } from 'lucide-react';

const HomePage = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    district_id: '',
    capacity_min: '',
    capacity_max: '',
    price_min: '',
    price_max: '',
    sort_by: 'v.name',
    order: 'ASC'
  });

  const districts = [
    { id: 1, name: 'Bektemir' },
    { id: 2, name: 'Chilonzor' },
    { id: 3, name: 'Mirobod' },
    { id: 4, name: 'Mirzo Ulug\'bek' },
    { id: 5, name: 'Olmazor' },
    { id: 6, name: 'Sergeli' },
    { id: 7, name: 'Shayxontohur' },
    { id: 8, name: 'Uchtepa' },
    { id: 9, name: 'Yakkasaroy' },
    { id: 10, name: 'Yashnobod' },
    { id: 11, name: 'Yunusobod' },
    { id: 12, name: 'Yangihayot' },
  ];

  const sortOptions = [
    { value: 'v.name', label: 'Nom bo\'yicha' },
    { value: 'v.price', label: 'Narx bo\'yicha' },
    { value: 'v.capacity', label: 'Sig\'im bo\'yicha' },
    { value: 'v.created_at', label: 'Yangi qo\'shilganlar' }
  ];

  // Debounced search functionality
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      handleFilterChange({ search: searchTerm });
    }, 500); // 500ms delay for debouncing

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Clean filters - remove empty values
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await api.get('/venues', { params: cleanFilters });
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      district_id: '',
      capacity_min: '',
      capacity_max: '',
      price_min: '',
      price_max: '',
      sort_by: 'v.name',
      order: 'ASC'
    });
    setSearchTerm('');
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => 
      key !== 'sort_by' && key !== 'order' && value !== ''
    ).length;
  }, [filters]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">
            Mavjud To'yxonalar
          </h1>
          <p className="text-center text-gray-600 max-w-2xl mx-auto">
            Toshkent shahrining eng yaxshi to'yxonalarini toping va o'zingizga mos bo'lganini tanlang
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="To'yxona nomini yoki manzilini qidiring..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
            />
          </div>
        </div>

        {/* Filter Toggle and Active Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Filterlar</span>
            {activeFiltersCount > 0 && (
              <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Barchasini tozalash</span>
            </button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 p-6 bg-white rounded-xl shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* District Filter */}
              <div>
                <label htmlFor="district_id" className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Tuman
                </label>
                <select
                  name="district_id"
                  id="district_id"
                  value={filters.district_id}
                  onChange={(e) => handleFilterChange({ district_id: e.target.value })}
                  className="block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Barcha tumanlar</option>
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Capacity Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline h-4 w-4 mr-1" />
                  Sig'im
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.capacity_min}
                    onChange={(e) => handleFilterChange({ capacity_min: e.target.value })}
                    className="block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.capacity_max}
                    onChange={(e) => handleFilterChange({ capacity_max: e.target.value })}
                    className="block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Narx (so'm)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min narx"
                    value={filters.price_min}
                    onChange={(e) => handleFilterChange({ price_min: e.target.value })}
                    className="block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    type="number"
                    placeholder="Max narx"
                    value={filters.price_max}
                    onChange={(e) => handleFilterChange({ price_max: e.target.value })}
                    className="block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saralash
                </label>
                <div className="space-y-2">
                  <select
                    value={filters.sort_by}
                    onChange={(e) => handleFilterChange({ sort_by: e.target.value })}
                    className="block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filters.order}
                    onChange={(e) => handleFilterChange({ order: e.target.value })}
                    className="block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="ASC">O'sish tartibida</option>
                    <option value="DESC">Kamayish tartibida</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        {!loading && venues.length > 0 && (
          <div className="mb-4 text-gray-600">
            <span className="font-medium">{venues.length}</span> ta to'yxona topildi
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Yuklanmoqda...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchVenues}
                className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                Qayta urinish
              </button>
            </div>
          </div>
        )}

        {/* Venues Grid */}
        {!loading && !error && (
          venues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {venues.map(venue => (
                <div key={venue.venue_id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
                  <div className="relative overflow-hidden">
                    <img 
                      src={venue.main_image_url || 'https://via.placeholder.com/400x250?text=To\'yxona'} 
                      alt={venue.name} 
                      className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4">
                      <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-800">
                        {venue.district_name}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                      {venue.name}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-600 text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{venue.address}</span>
                      </div>
                      <div className="flex items-center text-gray-600 text-sm">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{venue.capacity} kishi</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-bold text-indigo-600">
                        {venue.price?.toLocaleString()} so'm
                      </div>
                      <div className="text-sm text-gray-500">
                        / kishi
                      </div>
                    </div>
                    
                    <Link 
                      to={`/venues/${venue.venue_id}`}
                      className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                    >
                      Batafsil Ko'rish
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Hech qanday to'yxona topilmadi
                </h3>
                <p className="text-gray-600 mb-6">
                  Qidiruv shartlaringizni o'zgartirib ko'ring yoki filterlarni tozalang
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Filterlarni tozalash
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default HomePage;