import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import { Link as RouterLink } from 'react-router-dom'; // Agar kerak bo'lsa
// import './OwnerDashboard.css'; // CSS App.jsx da import qilingan

const OwnerDashboard = () => {
  const { user, API_BASE_URL } = useContext(AuthContext);
  const backendBaseUrl = 'http://localhost:5001'; // Rasm uchun

  const [myVenues, setMyVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVenueData, setNewVenueData] = useState({
    name: '', district_id: '', address: '', capacity: '', price: '', 
    phone_number: '', additional_info: '', main_image_url: ''
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [editVenueData, setEditVenueData] = useState({});

  const [showImagesModal, setShowImagesModal] = useState(false);
  const [currentVenueForImages, setCurrentVenueForImages] = useState(null);
  const [venueImages, setVenueImages] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [currentVenueForBookings, setCurrentVenueForBookings] = useState(null);
  const [venueBookings, setVenueBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [districts, setDistricts] = useState([]);

  const showAppMessage = (text, type = 'error', duration = 4000) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), duration);
  };

  // Fetch districts for forms
  const fetchDistricts = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/static/districts`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (response.data.success) {
        setDistricts(response.data.data);
      } else {
        console.error("Tumanlarni yuklashda xatolik:", response.data.message);
      }
    } catch (err) {
      console.error("Tumanlar API xatoligi:", err);
    }
  }, [API_BASE_URL, user]);

  // Fetch owner's venues
  const fetchMyVenues = useCallback(async () => {
    if (!user) return;
    setLoadingVenues(true); showAppMessage('', '');
    try {
      const response = await axios.get(`${API_BASE_URL}/venues/my-venues/list`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (response.data.success) {
        setMyVenues(response.data.data);
      } else {
        showAppMessage(response.data.message || "To'yxonalarni yuklashda xatolik.", "error");
      }
    } catch (err) {
      showAppMessage(err.response?.data?.message || "Server xatoligi (to'yxonalar).", "error");
    } finally {
      setLoadingVenues(false);
    }
  }, [API_BASE_URL, user]);

  useEffect(() => {
    fetchDistricts();
    fetchMyVenues();
  }, [fetchDistricts, fetchMyVenues]);

  // --- Create Venue ---
  const handleCreateVenueChange = (e) => setNewVenueData({ ...newVenueData, [e.target.name]: e.target.value });
  const handleCreateVenueSubmit = async (e) => {
    e.preventDefault(); showAppMessage('', '');
    if (!newVenueData.district_id) { showAppMessage("Iltimos, tumanni tanlang.", "error"); return; }
    try {
      const response = await axios.post(`${API_BASE_URL}/venues`, newVenueData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (response.data.success) {
        showAppMessage("To'yxona muvaffaqiyatli qo'shildi va tasdiqlash uchun yuborildi!", "success");
        setShowCreateForm(false);
        setNewVenueData({ name: '', district_id: '', address: '', capacity: '', price: '', phone_number: '', additional_info: '', main_image_url: '' });
        fetchMyVenues();
      } else { showAppMessage(response.data.message || "Yangi to'yxona yaratishda xatolik.", "error"); }
    } catch (err) { showAppMessage(err.response?.data?.message || "Server xatoligi (yangi to'yxona).", "error"); }
  };

  // --- Edit Venue ---
  const openEditModal = (venue) => {
    setEditingVenue(venue);
    setEditVenueData({
      name: venue.name || '', district_id: venue.district_id || '', address: venue.address || '',
      capacity: venue.capacity || '', price: venue.price || '', phone_number: venue.phone_number || '',
      additional_info: venue.additional_info || '', main_image_url: venue.main_image_url || ''
    });
    setShowEditModal(true);
  };
  const handleEditVenueChange = (e) => setEditVenueData({ ...editVenueData, [e.target.name]: e.target.value });
  const handleEditVenueSubmit = async (e) => {
    e.preventDefault(); showAppMessage('', '');
    if (!editingVenue || !editVenueData.district_id) { showAppMessage("Tuman tanlanmagan.", "error"); return; }
    try {
      const response = await axios.put(`${API_BASE_URL}/venues/${editingVenue.venue_id}`, editVenueData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (response.data.success) {
        showAppMessage("To'yxona ma'lumotlari muvaffaqiyatli yangilandi!", "success");
        setShowEditModal(false); setEditingVenue(null);
        fetchMyVenues();
      } else { showAppMessage(response.data.message || "To'yxonani yangilashda xatolik.", "error"); }
    } catch (err) { showAppMessage(err.response?.data?.message || "Server xatoligi (to'yxona yangilash).", "error"); }
  };

  // --- Manage Images ---
  const openImagesModal = async (venue) => {
    setCurrentVenueForImages(venue);
    setShowImagesModal(true);
    setVenueImages([]); // Eskisini tozalash
    if (venue) { // Rasm yuklash uchun venueId kerak, shuning uchun venue obyektini tekshiramiz
        setUploadingImage(true); showAppMessage('', '');
        try {
            const response = await axios.get(`${API_BASE_URL}/venues/${venue.venue_id}/images`);
            if (response.data.success) setVenueImages(response.data.data);
            else showAppMessage(response.data.message || "Rasmlarni yuklashda xatolik.", "error");
        } catch (err) { showAppMessage(err.response?.data?.message || "Server xatoligi (rasmlar).", "error"); }
        finally { setUploadingImage(false); }
    }
  };
  const handleImageFileChange = (e) => setImageFile(e.target.files[0]);
  const handleImageUpload = async () => {
    if (!imageFile || !currentVenueForImages) { showAppMessage("Rasm tanlanmagan yoki to'yxona belgilanmagan.", "error"); return; }
    setUploadingImage(true); showAppMessage('', '');
    const formData = new FormData();
    formData.append('venueImage', imageFile);
    try {
      const response = await axios.post(`${API_BASE_URL}/venues/${currentVenueForImages.venue_id}/images`, formData, {
        headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        showAppMessage("Rasm muvaffaqiyatli yuklandi!", "success");
        setImageFile(null); // Faylni tozalash
        document.getElementById('imageUploadInput').value = null; // Inputni tozalash
        openImagesModal(currentVenueForImages); // Rasmlar ro'yxatini yangilash
        fetchMyVenues(); // Asosiy to'yxona ro'yxatini ham yangilash (main_image_url o'zgargan bo'lishi mumkin)
      } else { showAppMessage(response.data.message || "Rasm yuklashda xatolik.", "error"); }
    } catch (err) { showAppMessage(err.response?.data?.message || "Server xatoligi (rasm yuklash).", "error"); }
    finally { setUploadingImage(false); }
  };
  const handleDeleteImage = async (imageId) => {
    if (!currentVenueForImages || !window.confirm("Haqiqatan ham bu rasmni o'chirmoqchimisiz?")) return;
    showAppMessage('', '');
    try {
        const response = await axios.delete(`${API_BASE_URL}/venues/${currentVenueForImages.venue_id}/images/${imageId}`, {
            headers: { Authorization: `Bearer ${user.token}` }
        });
        if (response.data.success) {
            showAppMessage("Rasm muvaffaqiyatli o'chirildi!", "success");
            openImagesModal(currentVenueForImages);
            fetchMyVenues();
        } else { showAppMessage(response.data.message || "Rasmni o'chirishda xatolik.", "error");}
    } catch (err) { showAppMessage(err.response?.data?.message || "Server xatoligi (rasm o'chirish).", "error");}
  };
   const handleSetMainImage = async (imageId) => {
    if (!currentVenueForImages || !window.confirm("Bu rasmni asosiy qilib belgilamoqchimisiz?")) return;
    showAppMessage('', '');
    try {
        const response = await axios.put(`${API_BASE_URL}/venues/${currentVenueForImages.venue_id}/images/${imageId}/set-main`, {}, {
            headers: { Authorization: `Bearer ${user.token}` }
        });
        if (response.data.success) {
            showAppMessage("Rasm asosiy qilib belgilandi!", "success");
            openImagesModal(currentVenueForImages); // Ro'yxatni yangilash (agar UI da ko'rsatilsa)
            fetchMyVenues(); // Asosiy to'yxona kartochkasidagi rasmni yangilash
        } else { showAppMessage(response.data.message || "Rasmni asosiy qilishda xatolik.", "error");}
    } catch (err) { showAppMessage(err.response?.data?.message || "Server xatoligi (rasm asosiy qilish).", "error");}
  };


  // --- Manage Bookings for Venue ---
  const openBookingsModal = async (venue) => {
    setCurrentVenueForBookings(venue);
    setShowBookingsModal(true);
    setVenueBookings([]);
    if(venue) {
        setLoadingBookings(true); showAppMessage('', '');
        try {
            const response = await axios.get(`${API_BASE_URL}/bookings/venue-owner/${venue.venue_id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (response.data.success) setVenueBookings(response.data.data);
            else showAppMessage(response.data.message || "Bronlarni yuklashda xatolik.", "error");
        } catch (err) { showAppMessage(err.response?.data?.message || "Server xatoligi (bronlar).", "error"); }
        finally { setLoadingBookings(false); }
    }
  };
  const handleOwnerCancelBooking = async (bookingId) => {
    showAppMessage('', '');
    if (!window.confirm("Haqiqatan ham bu bronni bekor qilmoqchimisiz?")) return;
    try {
      const response = await axios.put(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (response.data.success) {
        showAppMessage("Bron muvaffaqiyatli bekor qilindi.", "success");
        if(currentVenueForBookings) openBookingsModal(currentVenueForBookings); // Ro'yxatni yangilash
      } else { showAppMessage(`Xatolik: ${response.data.message}`, "error"); }
    } catch (err) { showAppMessage(`Server xatoligi: ${err.response?.data?.message}`, "error"); }
  };


  return (
    <div className="dashboard-page owner-dashboard">
      <h2>To'yxona Egasi Paneli</h2>
      {message.text && <div className={`message-banner ${message.type}`}>{message.text}</div>}

      <button onClick={() => setShowCreateForm(!showCreateForm)} className="action-button create-venue-btn">
        <i className={`fas ${showCreateForm ? 'fa-minus-circle' : 'fa-plus-circle'}`}></i> 
        {showCreateForm ? " Formani Yashirish" : " Yangi To'yxona Qo'shish"}
      </button>

      {showCreateForm && (
        <form onSubmit={handleCreateVenueSubmit} className="venue-form owner-form">
          <h3>Yangi To'yxona Ma'lumotlari</h3>
          <div className="form-grid">
            <div className="form-group"><label>Nomi*:</label><input type="text" name="name" value={newVenueData.name} onChange={handleCreateVenueChange} required /></div>
            <div className="form-group"><label>Tuman*:</label><select name="district_id" value={newVenueData.district_id} onChange={handleCreateVenueChange} required><option value="">Tanlang...</option>{districts.map(d => <option key={d.district_id} value={d.district_id}>{d.district_name}</option>)}</select></div>
            <div className="form-group full-width"><label>Manzil*:</label><input type="text" name="address" value={newVenueData.address} onChange={handleCreateVenueChange} required /></div>
            <div className="form-group"><label>Sig'im (kishi)*:</label><input type="number" name="capacity" value={newVenueData.capacity} onChange={handleCreateVenueChange} required min="1"/></div>
            <div className="form-group"><label>Narx (so'm)*:</label><input type="number" name="price" value={newVenueData.price} onChange={handleCreateVenueChange} required min="0"/></div>
            <div className="form-group"><label>Telefon Raqam:</label><input type="tel" name="phone_number" value={newVenueData.phone_number} onChange={handleCreateVenueChange} /></div>
            <div className="form-group full-width"><label>Asosiy Rasm URL (ixtiyoriy):</label><input type="text" name="main_image_url" value={newVenueData.main_image_url} onChange={handleCreateVenueChange} placeholder="https://..."/></div>
            <div className="form-group full-width"><label>Qo'shimcha Ma'lumot:</label><textarea name="additional_info" value={newVenueData.additional_info} onChange={handleCreateVenueChange}></textarea></div>
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-button">Yaratish</button>
            <button type="button" onClick={() => setShowCreateForm(false)} className="cancel-button">Bekor</button>
          </div>
        </form>
      )}

      <h3>Mening To'yxonalarim</h3>
      {loadingVenues && <p className="loading-text">Yuklanmoqda...</p>}
      {!loadingVenues && myVenues.length === 0 && <p>Sizda hali to'yxonalar mavjud emas.</p>}
      
      <div className="venues-list-owner">
        {!loadingVenues && myVenues.map(venue => (
          <div key={venue.venue_id} className="venue-item-card owner-venue-card">
            <div className="venue-card-header">
                <h4>{venue.name}</h4>
                <span className={`status-badge status-${venue.venue_status?.toLowerCase().replace(/ /g, '_')}`}>{venue.venue_status}</span>
            </div>
            <div className="venue-card-body">
                {venue.main_image_url && 
                    <img src={`${backendBaseUrl}${venue.main_image_url}`} alt={venue.name} className="owner-venue-image" onError={(e) => { e.target.src = 'https://placehold.co/300x200/EBD8C3/7A3E3E?text=Rasm+Yuklanmadi'; }}/>
                }
                <p><strong>Tuman:</strong> {venue.district_name}</p>
                <p><strong>Manzil:</strong> {venue.address}</p>
                <p><strong>Sig'im:</strong> {venue.capacity} kishi</p>
                <p><strong>Narx:</strong> {venue.price?.toLocaleString()} so'm</p>
            </div>
            <div className="venue-actions owner-actions">
              <RouterLink to={`/venue/${venue.venue_id}`} className="action-link view-link" title="Ko'rish"><i className="fas fa-eye"></i></RouterLink>
              <button onClick={() => openEditModal(venue)} className="action-link edit-link" title="Tahrirlash"><i className="fas fa-edit"></i></button>
              <button onClick={() => openImagesModal(venue)} className="action-link images-link" title="Rasmlar"><i className="fas fa-images"></i></button>
              <button onClick={() => openBookingsModal(venue)} className="action-link bookings-link" title="Bronlar"><i className="fas fa-calendar-check"></i></button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Venue Modal */}
      {showEditModal && editingVenue && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
            <div className="modal-content owner-form" onClick={e => e.stopPropagation()}>
                <h4>"{editingVenue.name}"ni Tahrirlash</h4>
                <form onSubmit={handleEditVenueSubmit}>
                    <div className="form-grid">
                        <div className="form-group"><label>Nomi*:</label><input type="text" name="name" defaultValue={editVenueData.name} onChange={handleEditVenueChange} required /></div>
                        <div className="form-group"><label>Tuman*:</label><select name="district_id" defaultValue={editVenueData.district_id} onChange={handleEditVenueChange} required><option value="">Tanlang...</option>{districts.map(d => <option key={d.district_id} value={d.district_id}>{d.district_name}</option>)}</select></div>
                        <div className="form-group full-width"><label>Manzil*:</label><input type="text" name="address" defaultValue={editVenueData.address} onChange={handleEditVenueChange} required /></div>
                        <div className="form-group"><label>Sig'im*:</label><input type="number" name="capacity" defaultValue={editVenueData.capacity} onChange={handleEditVenueChange} required min="1"/></div>
                        <div className="form-group"><label>Narx*:</label><input type="number" name="price" defaultValue={editVenueData.price} onChange={handleEditVenueChange} required min="0"/></div>
                        <div className="form-group"><label>Telefon:</label><input type="tel" name="phone_number" defaultValue={editVenueData.phone_number} onChange={handleEditVenueChange} /></div>
                        <div className="form-group full-width"><label>Asosiy Rasm URL:</label><input type="text" name="main_image_url" defaultValue={editVenueData.main_image_url} onChange={handleEditVenueChange} /></div>
                        <div className="form-group full-width"><label>Qo'shimcha Ma'lumot:</label><textarea name="additional_info" defaultValue={editVenueData.additional_info} onChange={handleEditVenueChange}></textarea></div>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="submit-button">Saqlash</button>
                        <button type="button" onClick={() => setShowEditModal(false)} className="cancel-button">Bekor</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Manage Images Modal */}
      {showImagesModal && currentVenueForImages && (
          <div className="modal-backdrop" onClick={() => setShowImagesModal(false)}>
              <div className="modal-content images-modal" onClick={e => e.stopPropagation()}>
                  <h4>"{currentVenueForImages.name}" Rasmlari</h4>
                  <div className="image-upload-form">
                      <input type="file" id="imageUploadInput" onChange={handleImageFileChange} accept="image/*" />
                      <button onClick={handleImageUpload} disabled={!imageFile || uploadingImage} className="upload-image-btn">
                        {uploadingImage ? "Yuklanmoqda..." : <><i className="fas fa-upload"></i> Rasm Yuklash</>}
                      </button>
                  </div>
                  <div className="venue-gallery owner-gallery">
                      {loadingVenueImages && <p>Rasmlar yuklanmoqda...</p>}
                      {!loadingVenueImages && venueImages.length === 0 && <p>Hozircha rasmlar yo'q.</p>}
                      {!loadingVenueImages && venueImages.map(img => (
                          <div key={img.image_id} className="gallery-item">
                              <img src={`${backendBaseUrl}${img.image_url}`} alt="To'yxona surati" />
                              <div className="gallery-item-actions">
                                  {currentVenueForImages.main_image_url !== img.image_url && 
                                    <button onClick={() => handleSetMainImage(img.image_id)} className="set-main-btn" title="Asosiy qilish"><i className="fas fa-star"></i></button>}
                                  <button onClick={() => handleDeleteImage(img.image_id)} className="delete-image-btn" title="O'chirish"><i className="fas fa-trash"></i></button>
                              </div>
                              {currentVenueForImages.main_image_url === img.image_url && <span className="main-image-badge">Asosiy</span>}
                          </div>
                      ))}
                  </div>
                  <div className="form-actions">
                      <button type="button" onClick={() => setShowImagesModal(false)} className="cancel-button">Yopish</button>
                  </div>
              </div>
          </div>
      )}

      {/* View Bookings Modal */}
        {showBookingsModal && currentVenueForBookings && (
            <div className="modal-backdrop" onClick={() => setShowBookingsModal(false)}>
                <div className="modal-content bookings-modal" onClick={e => e.stopPropagation()}>
                    <h4>"{currentVenueForBookings.name}" uchun Bronlar</h4>
                    {loadingBookings && <p className="loading-text">Bronlar yuklanmoqda...</p>}
                    {!loadingBookings && venueBookings.length === 0 && <p>Bu to'yxona uchun bronlar yo'q.</p>}
                    {!loadingBookings && venueBookings.length > 0 && (
                        <div className="table-responsive">
                        <table className="admin-table booking-table-owner">
                            <thead><tr><th>ID</th><th>Klient</th><th>Sana</th><th>Mehmonlar</th><th>Status</th><th>Amallar</th></tr></thead>
                            <tbody>
                                {venueBookings.map(b => (
                                    <tr key={b.booking_id}>
                                        <td>{b.booking_id}</td><td>{b.client_fio}<br/><small>{b.client_phone}</small></td><td>{new Date(b.booking_date).toLocaleDateString()}</td>
                                        <td>{b.number_of_guests}</td>
                                        <td><span className={`status-badge status-${b.booking_status?.toLowerCase().replace(/ /g, '_')}`}>{b.booking_status}</span></td>
                                        <td className="actions-cell">
                                             {(b.booking_status === 'Kutilmoqda' || b.booking_status === 'Tasdiqlangan') && 
                                                new Date(b.booking_date) >= new Date().setHours(0,0,0,0) &&
                                                <button onClick={() => handleOwnerCancelBooking(b.booking_id)} className="delete-btn" title="Bekor Qilish"><i className="fas fa-ban"></i></button>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    )}
                     <div className="form-actions">
                        <button type="button" onClick={() => setShowBookingsModal(false)} className="cancel-button">Yopish</button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};
export default OwnerDashboard;