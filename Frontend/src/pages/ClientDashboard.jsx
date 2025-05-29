import React, { useState, useEffect, useContext } from 'react'; // React ni import qilish
import axios from 'axios';
import { AuthContext } from '../App';
// import './ClientDashboard.css'; // App.jsx da import qilingan

const ClientDashboard = () => {
  const { user, API_BASE_URL } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const fetchMyBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = user.token;
      const response = await axios.get(`${API_BASE_URL}/bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setBookings(response.data.data);
      } else {
        setError(response.data.message || "Bronlarni yuklashda xatolik.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Server xatoligi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyBookings();
    }
  }, [user, API_BASE_URL]);

  const handleCancelBooking = async (bookingId) => {
    setMessage('');
    if (!window.confirm("Haqiqatan ham bu bronni bekor qilmoqchimisiz?")) return;
    try {
      const token = user.token;
      const response = await axios.put(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setMessage("Bron muvaffaqiyatli bekor qilindi.");
        fetchMyBookings(); // Ro'yxatni yangilash
      } else {
        setMessage(`Xatolik: ${response.data.message}`);
      }
    } catch (err) {
      setMessage(`Server xatoligi: ${err.response?.data?.message}`);
    }
  };

  if (loading) return <div className="loading-text dashboard-page">Yuklanmoqda...</div>;
  if (error) return <div className="error-text dashboard-page">Xatolik: {error}</div>;

  return (
    <div className="dashboard-page client-dashboard">
      <h2>Mening Bronlarim</h2>
      {message && <p className={message.startsWith("Xatolik") ? "error-text" : "success-message"}>{message}</p>}
      {bookings.length === 0 ? (
        <p>Sizda hali bronlar mavjud emas.</p>
      ) : (
        <div className="bookings-list">
          {bookings.map(booking => (
            <div key={booking.booking_id} className="booking-item-card">
              <h3>{booking.venue_name}</h3>
              <p><strong>Manzil:</strong> {booking.venue_address}, {booking.district_name}</p>
              <p><strong>Sana:</strong> {new Date(booking.booking_date).toLocaleDateString()}</p>
              <p><strong>Mehmonlar:</strong> {booking.number_of_guests} kishi</p>
              <p><strong>Status:</strong> <span className={`status-${booking.booking_status?.toLowerCase().replace(/ /g, '_')}`}>{booking.booking_status}</span></p>
              <p><small>Bron qilingan sana: {new Date(booking.created_at).toLocaleString()}</small></p>
              {(booking.booking_status === 'Kutilmoqda' || booking.booking_status === 'Tasdiqlangan') && 
                new Date(booking.booking_date) >= new Date().setHours(0,0,0,0) && ( // Faqat kelajakdagi va joriy kun uchun
                <button 
                    onClick={() => handleCancelBooking(booking.booking_id)} 
                    className="cancel-booking-button"
                >
                    Bekor Qilish
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default ClientDashboard;