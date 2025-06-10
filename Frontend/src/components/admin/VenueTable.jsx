import React from 'react';

const VenueTable = ({ venues, onView, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto shadow-md rounded-lg mt-6">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-200 text-gray-700">
          <tr>
            <th className="py-3 px-4 text-left">ID</th>
            <th className="py-3 px-4 text-left">Nomi</th>
            <th className="py-3 px-4 text-left">Manzil</th>
            <th className="py-3 px-4 text-left">Tuman</th>
            <th className="py-3 px-4 text-left">Sig'imi</th>
            <th className="py-3 px-4 text-left">Narxi</th>
            <th className="py-3 px-4 text-left">Status</th>
            <th className="py-3 px-4 text-left">Amallar</th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {venues.length > 0 ? venues.map((venue, index) => (
            <tr key={venue.venue_id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
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
                <button onClick={() => onView(venue)} className="text-blue-600 hover:text-blue-800 mr-2">👁️</button>
                <button onClick={() => onEdit(venue)} className="text-yellow-600 hover:text-yellow-800 mr-2">✏️</button>
                <button onClick={() => onDelete(venue.venue_id)} className="text-red-600 hover:text-red-800">🗑️</button>
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
  );
};

export default VenueTable;
