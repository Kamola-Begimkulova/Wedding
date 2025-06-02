import React from 'react';

const VenueFilterSort = ({ filters, onFilterChange, districts, venueStatuses }) => {
  const handleChange = (e) => {
    onFilterChange({ [e.target.name]: e.target.value });
  };

  return (
    <div className="p-4 bg-white shadow rounded-lg mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
      <div>
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Qidiruv</label>
        <input
          type="text"
          name="search"
          id="search"
          value={filters.search}
          onChange={handleChange}
          placeholder="Nomi, manzili bo'yicha..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      
      <div>
        <label htmlFor="district_id" className="block text-sm font-medium text-gray-700 mb-1">Tuman</label>
        <select
          name="district_id"
          id="district_id"
          value={filters.district_id}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Barcha tumanlar</option>
          {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="status_name" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          name="status_name"
          id="status_name"
          value={filters.status_name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Barcha statuslar</option>
          {venueStatuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
            <label htmlFor="sort_by" className="block text-sm font-medium text-gray-700 mb-1">Saralash</label>
            <select
            name="sort_by"
            id="sort_by"
            value={filters.sort_by}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
            {/* Backenddagi ruxsat etilgan sort_by qiymatlari [cite: 155] */}
            <option value="v.created_at">Qo'shilgan sana</option>
            <option value="v.name">Nomi</option>
            <option value="v.price">Narxi</option>
            <option value="v.capacity">Sig'imi</option>
            </select>
        </div>
        <div>
            <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1 invisible">Tartib</label> {/* Label for alignment */}
            <select
            name="order"
            id="order"
            value={filters.order}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
            <option value="DESC">Kamayish</option>
            <option value="ASC">O'sish</option>
            </select>
        </div>
      </div>
      {/* Boshqa filterlar uchun inputlar (capacity, price range) qo'shilishi mumkin */}
    </div>
  );
};

export default VenueFilterSort;