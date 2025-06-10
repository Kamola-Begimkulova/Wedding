// AdminVenuesPage.jsx - Debug versiyasi
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import VenueFilterSort from '../../components/admin/VenueFilterSort';
import VenueTable from '../../components/admin/VenueTable';
import Modal from '../../components/common/Modal';
import VenueForm from '../../components/admin/VenueForm';

const AdminVenuesPage = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    district_id: '',
    status_name: '',
    sort_by: 'v.created_at',
    order: 'DESC',
  });

  // Modal states
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [isSubmittingVenue, setIsSubmittingVenue] = useState(false);

  // Assign owner modal states
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [assignUserId, setAssignUserId] = useState('');
  const [owners, setOwners] = useState([]);

  // Static data - yuqoriga ko'tarildi
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

  const venueStatuses = [
    { id: 1, name: 'Kutilmoqda' },
    { id: 2, name: 'Tasdiqlangan' },
    { id: 3, name: 'Tasdiqlanmagan' },
    { id: 4, name: 'Rad etilgan' }
  ];

  // Fetch venues with filters
  const fetchVenues = useCallback(async () => {
    console.log('fetchVenues chaqirildi, filters:', filters);
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/venues', { params: filters });
      console.log('Venues response:', response.data);
      setVenues(response.data.data || []);
    } catch (err) {
      console.error('Venues fetch error:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch venue owners
  const fetchOwners = async () => {
    console.log('fetchOwners chaqirildi');
    try {
      const res = await api.get('/admin/users', {
        params: { role_name: 'To_yxona_Egasi' }
      });
      console.log('Owners response:', res.data);
      setOwners(res.data.data || []);
    } catch (err) {
      console.error('Ownerlarni olishda xatolik:', err);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  // Filter change handler
  const handleFilterChange = (newFilters) => {
    console.log('Filter o\'zgartirildi:', newFilters);
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Venue modal handlers
  const handleOpenVenueModal = (venue = null) => {
    console.log('Modal ochildi, venue:', venue);
    setEditingVenue(venue);
    setIsVenueModalOpen(true);
  };

  const handleCloseVenueModal = () => {
    console.log('Modal yopildi');
    setEditingVenue(null);
    setIsVenueModalOpen(false);
  };

  // Submit venue form
  const handleVenueSubmit = async (venueData, venueId) => {
    console.log('handleVenueSubmit chaqirildi!');
    console.log('Kelgan venueData:', venueData);
    console.log('venueId:', venueId);
    
    setIsSubmittingVenue(true);
    try {
      const response = venueId
        ? await api.put(`/admin/venues/${venueId}`, venueData)
        : await api.post(`/admin/venues`, venueData);

      console.log('API response:', response.data);

      if (response.data.success) {
        alert(venueId ? "To'yxona yangilandi!" : "To'yxona qo'shildi!");
        handleCloseVenueModal();
        fetchVenues();
      } else {
        alert(response.data.message || 'Xatolik yuz berdi');
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert(err.response?.data?.message || err.message);
    } finally {
      setIsSubmittingVenue(false);
    }
  };

  // Delete venue
  const handleDelete = async (venueId) => {
    if (!window.confirm("Haqiqatan ham o'chirmoqchimisiz?")) return;
    
    try {
      await api.delete(`/admin/venues/${venueId}`);
      alert("To'yxona muvaffaqiyatli o'chirildi!");
      fetchVenues();
    } catch (err) {
      alert("O'chirishda xatolik: " + (err.response?.data?.message || err.message));
    }
  };

  // Open assign modal
  const openAssignModal = (venue) => {
    setSelectedVenue(venue);
    setAssignUserId('');
    setAssignModalOpen(true);
    fetchOwners();
  };

  // Handle assign owner
  const handleAssignSubmit = async () => {
    if (!assignUserId) {
      alert("Iltimos, foydalanuvchini tanlang!");
      return;
    }

    try {
      const res = await api.put(`/admin/venues/${selectedVenue.venue_id}/assign-owner`, {
        owner_user_id: assignUserId
      });
      alert(res.data.message || "Muvaffaqiyatli biriktirildi!");
      setAssignModalOpen(false);
      setAssignUserId('');
      fetchVenues();
    } catch (err) {
      alert("Biriktirishda xatolik: " + (err.response?.data?.message || err.message));
    }
  };

  console.log('AdminVenuesPage render:', {
    isVenueModalOpen,
    editingVenue,
    districts: districts.length
  });

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">To'yxonalarni Boshqarish (Admin)</h1>
        <button 
          onClick={() => {
            console.log('Yangi to\'yxona tugmasi bosildi');
            handleOpenVenueModal();
          }}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors duration-200"
        >
          + Yangi To'yxona
        </button>
      </div>

      {/* Filters */}
      <VenueFilterSort
        filters={filters}
        onFilterChange={handleFilterChange}
        districts={districts}
        venueStatuses={venueStatuses}
      />

      {/* Loading state */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-2">Yuklanmoqda...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-4 mb-4">
          <p className="text-red-500 bg-red-100 border border-red-500 rounded-md p-4">
            Xatolik: {error}
          </p>
        </div>
      )}

      {/* Venues table */}
      {!loading && !error && (
        <VenueTable
          venues={venues}
          onView={(venue) => handleOpenVenueModal(venue)}
          onEdit={(venue) => handleOpenVenueModal(venue)}
          onDelete={handleDelete}
          onAssign={openAssignModal}
        />
      )}

      {/* Venue Form Modal */}
      <Modal 
        isOpen={isVenueModalOpen} 
        onClose={handleCloseVenueModal} 
        title={editingVenue ? "To'yxonani Tahrirlash" : "Yangi To'yxona Qo'shish"}
      >
        {isVenueModalOpen && (
          <VenueForm
            key={editingVenue?.venue_id || 'new'} // Re-render uchun key
            initialData={editingVenue || {}}
            onSubmit={handleVenueSubmit}
            onCancel={handleCloseVenueModal}
            isSubmitting={isSubmittingVenue}
            districts={districts}
          />
        )}
      </Modal>

      {/* Assign Owner Modal */}
      <Modal 
        isOpen={assignModalOpen} 
        onClose={() => setAssignModalOpen(false)} 
        title="To'yxona Egasi Biriktirish"
      >
        <div className="space-y-4">
          <div>
            <p className="text-gray-700 mb-2">
              Tanlangan to'yxona: <strong className="text-blue-600">{selectedVenue?.name}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Manzil: {selectedVenue?.address}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To'yxona egasini tanlang:
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
            >
              <option value="">-- Foydalanuvchini tanlang --</option>
              {owners.map(owner => (
                <option key={owner.user_id} value={owner.user_id}>
                  {owner.fio} ({owner.username})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button 
              onClick={() => setAssignModalOpen(false)} 
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
            >
              Bekor qilish
            </button>
            <button 
              onClick={handleAssignSubmit}
              disabled={!assignUserId}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Biriktirish
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminVenuesPage;