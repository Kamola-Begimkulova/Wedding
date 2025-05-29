import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar'; // react-calendar importi
// import 'react-calendar/dist/Calendar.css'; // App.jsx da global import qilindi
import { AuthContext } from '../App';
// import './VenueDetailPage.css'; // CSS App.jsx da import qilingan

const VenueDetailPage = () => {
  const { venueId } = useParams();
  const { user, API_BASE_URL } = useContext(AuthContext);
  const navigate = useNavigate();
  const backendBaseUrl = 'http://localhost:5001'; // Rasm uchun

  const [venue, setVenue] = useState(null);
  const [images, setImages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [bookedDatesInfo, setBookedDatesInfo] = useState([]); // { date: 'YYYY-MM-DD', status: 'booked_confirmed' | 'booked_pending', clientInfo?: {...} }
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });


  // Calendar state
  const [calendarActiveStartDate, setCalendarActiveStartDate] = useState(new Date());

  // Booking form state
  const [selectedDate, setSelectedDate] = useState(null); // Calendar tanlagan sana
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const showPageMessage = (text, type = 'error', duration = 4000) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), duration);
  };

  const fetchVenueDetails = useCallback(async () => {
    try {
      const venueRes = await axios.get(`${API_BASE_URL}/venues/${venueId}`);
      if (venueRes.data.success) {
        setVenue(venueRes.data.data);
      } else {
        throw new Error(venueRes.data.message || "To'yxona topilmadi");
      }
    } catch (err) {
      console.error("To'yxona ma'lumotlarini yuklashda xatolik:", err);
      setError(err.message || "Server bilan bog'lanishda xatolik (to'yxona).");
      setVenue(null); // Xatolik bo'lsa, venue ni null qilish
    }
  }, [API_BASE_URL, venueId]);

  const fetchVenueImages = useCallback(async () => {
    try {
      const imagesRes = await axios.get(`${API_BASE_URL}/venues/${venueId}/images`);
      if (imagesRes.data.success) setImages(imagesRes.data.data);
    } catch (err) { console.error("To'yxona rasmlarini yuklashda xatolik:", err); }
  }, [API_BASE_URL, venueId]);

  const fetchVenueReviews = useCallback(async () => {
    try {
      const reviewsRes = await axios.get(`${API_BASE_URL}/venues/${venueId}/reviews`);
      if (reviewsRes.data.success) setReviews(reviewsRes.data.data);
    } catch (err) { console.error("To'yxona izohlarini yuklashda xatolik:", err); }
  }, [API_BASE_URL, venueId]);

  const fetchCalendarData = useCallback(async (dateForMonth) => {
    const year = dateForMonth.getFullYear();
    const month = dateForMonth.getMonth() + 1; // API 1-12 qabul qiladi
    try {
      const calendarRes = await axios.get(`${API_BASE_URL}/venues/${venueId}/calendar/${year}/${month}`);
      if (calendarRes.data.success) {
        setBookedDatesInfo(calendarRes.data.calendar_data || []);
      } else {
        console.error("Kalendar ma'lumotlarini yuklashda xatolik:", calendarRes.data.message);
        setBookedDatesInfo([]);
      }
    } catch (err) {
      console.error("Kalendar API xatoligi:", err);
      setBookedDatesInfo([]);
    }
  }, [API_BASE_URL, venueId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchVenueDetails(),
      fetchVenueImages(),
      fetchVenueReviews(),
      fetchCalendarData(calendarActiveStartDate) // Joriy oy uchun kalendar
    ]).finally(() => setLoading(false));
  }, [venueId, fetchVenueDetails, fetchVenueImages, fetchVenueReviews, fetchCalendarData, calendarActiveStartDate]);

  const handleCalendarMonthChange = ({ activeStartDate }) => {
    setCalendarActiveStartDate(activeStartDate);
    // fetchCalendarData(activeStartDate); // Bu useEffect da calendarActiveStartDate o'zgarishi bilan chaqiriladi
  };

  const handleDateClick = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const isBooked = bookedDatesInfo.some(d => d.date === dateStr);
    if (new Date(date) < new Date().setHours(0,0,0,0)) {
        showPageMessage("O'tgan sanani tanlab bo'lmaydi.", "error");
        setSelectedDate(null);
        return;
    }
    if (isBooked) {
      showPageMessage("Bu sana band, boshqa sanani tanlang.", "error");
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
      showPageMessage('', ''); // Clear previous messages
      setBookingDate(date.toISOString().split('T')[0]); // Formadagi input uchun
    }
  };

  const tileDisabled = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0];
      return bookedDatesInfo.some(d => d.date === dateStr) || date < new Date().setHours(0,0,0,0) ;
    }
    return false;
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0];
      const bookingInfo = bookedDatesInfo.find(d => d.date === dateStr);
      if (bookingInfo) {
        if (bookingInfo.status === 'booked_confirmed') return 'date-booked-confirmed';
        if (bookingInfo.status === 'booked_pending') return 'date-booked-pending';
      }
       if (date < new Date().setHours(0,0,0,0) && !bookingInfo) return 'date-past';
    }
    return null;
  };
  
  // Booking form state (App.jsx dagi kabi, lekin bu yerda alohida)
  const [bookingDateInput, setBookingDate] = useState(''); // Calendar tanlagandan keyin o'rnatiladi

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    showPageMessage('', ''); 
    setBookingLoading(true);
    if (!user) {
      showPageMessage("Bron qilish uchun tizimga kiring.", "error");
      setBookingLoading(false);
      navigate('/login', { state: { from: `/venue/${venueId}` } }); // Login sahifasiga yo'naltirish
      return;
    }
    if (user.role !== 'Klient') {
      showPageMessage("Faqat Klientlar bron qilishi mumkin.", "error");
      setBookingLoading(false);
      return;
    }
    if (!selectedDate || !numberOfGuests || numberOfGuests < 1) {
      showPageMessage("Iltimos, sana tanlang va mehmonlar sonini to'g'ri kiriting.", "error");
      setBookingLoading(false);
      return;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/bookings`, 
          { venue_id: venueId, booking_date: bookingDateInput, number_of_guests: numberOfGuests },
          { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (response.data.success) {
        showPageMessage("Broningiz qabul qilindi! Tez orada tasdiqlanadi.", "success");
        setSelectedDate(null); setBookingDate(''); setNumberOfGuests(1);
        fetchCalendarData(calendarActiveStartDate); // Kalendarni yangilash
      } else {
        showPageMessage(response.data.message || "Bron qilishda xatolik.", "error");
      }
    } catch (err) {
      showPageMessage(err.response?.data?.message || "Server xatoligi (bron qilish).", "error");
    } finally {
      setBookingLoading(false);
    }
  };
  
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    showPageMessage('', ''); 
    setReviewLoading(true);
    if (!user) {
      showPageMessage("Izoh qoldirish uchun tizimga kiring.", "error");
      setReviewLoading(false);
      navigate('/login', { state: { from: `/venue/${venueId}` } });
      return;
    }
     if (user.role !== 'Klient') {
      showPageMessage("Faqat Klientlar izoh qoldirishi mumkin.", "error");
      setReviewLoading(false);
      return;
    }
     try {
        const response = await axios.post(`${API_BASE_URL}/venues/${venueId}/reviews`, 
            { rating: reviewRating, comment: reviewComment },
            { headers: { Authorization: `Bearer ${user.token}` } }
        );
        if (response.data.success) {
            showPageMessage("Izohingiz uchun rahmat!", "success");
            setReviewRating(5); setReviewComment('');
            fetchVenueReviews(); // Izohlarni yangilash
            fetchVenueDetails(); // Reytingni yangilash uchun to'yxona ma'lumotlarini qayta yuklash
        } else {
            showPageMessage(response.data.message || "Izoh yuborishda xatolik.", "error");
        }
    } catch (err) {
        showPageMessage(err.response?.data?.message || "Server xatoligi (izoh yuborish).", "error");
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) return <div className="loading-app">Yuklanmoqda...</div>;
  if (error) return <div className="page-container error-text">Xatolik: {error} <RouterLink to="/" className="action-link">Asosiy sahifaga</RouterLink></div>;
  if (!venue) return <div className="page-container">To'yxona topilmadi. <RouterLink to="/" className="action-link">Asosiy sahifaga</RouterLink></div>;

  return (
    <div className="venue-detail-page">
      {message.text && <div className={`message-banner page-message ${message.type}`}>{message.text}</div>}
      <div className="venue-header-detail">
        {venue.main_image_url ? (
          <img src={`${backendBaseUrl}${venue.main_image_url}`} alt={venue.name} className="venue-main-image-detail" onError={(e) => { e.target.src = 'https://placehold.co/1200x450/EBD8C3/7A3E3E?text=Rasm+Mavjud+Emas'; }}/>
        ) : (
           <img src='https://placehold.co/1200x450/EBD8C3/7A3E3E?text=Rasm+Mavjud+Emas' alt={venue.name} className="venue-main-image-detail"/>
        )}
        <div className="venue-header-overlay">
            <h1>{venue.name}</h1>
            <p className="venue-meta-detail">{venue.district_name} | {venue.capacity} kishilik | Narxi: {venue.price?.toLocaleString()} so'm</p>
            {venue.average_rating !== null && venue.average_rating !== undefined && (
                <p className="venue-rating-stars">
                {'⭐'.repeat(Math.round(venue.average_rating))}
                <span className="review-count">({venue.review_count || 0} izoh)</span>
                </p>
            )}
        </div>
      </div>

      <div className="venue-content-grid-detail">
        <div className="venue-info-section-detail">
          <h2><i className="fas fa-info-circle"></i> To'yxona Haqida</h2>
          <p><strong><i className="fas fa-map-marker-alt"></i> Manzil:</strong> {venue.address}</p>
          {venue.phone_number && <p><strong><i className="fas fa-phone-alt"></i> Telefon:</strong> {venue.phone_number}</p>}
          {venue.additional_info && <><h3><i className="fas fa-plus-circle"></i> Qo'shimcha Ma'lumotlar</h3><p>{venue.additional_info}</p></>}
          
          {images.length > 0 && (
            <>
              <h3><i className="fas fa-images"></i> Rasmlar Galereyasi</h3>
              <div className="venue-gallery-detail">
                {images.map(img => (
                  <img key={img.image_id} src={`${backendBaseUrl}${img.image_url}`} alt={`${venue.name} qo'shimcha surati`} onError={(e) => { e.target.style.display='none'; }}/>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="venue-booking-calendar-section-detail">
          <h2><i className="fas fa-calendar-alt"></i> Bron Qilish va Kalendar</h2>
          <Calendar
            onActiveStartDateChange={handleCalendarMonthChange}
            onClickDay={handleDateClick}
            value={selectedDate} // Tanlangan kunni belgilash uchun
            tileDisabled={tileDisabled}
            tileClassName={tileClassName}
            minDate={new Date()} // O'tgan kunlarni tanlab bo'lmaydi
            className="venue-interactive-calendar"
            locale="uz-UZ" // O'zbek tili uchun (agar kerak bo'lsa, sozlash kerak)
          />
          {selectedDate && <p className="selected-date-info">Tanlangan sana: <strong>{selectedDate.toLocaleDateString('uz-UZ')}</strong></p>}
          
          {user && user.role === 'Klient' && (
            <form onSubmit={handleBookingSubmit} className="booking-form-detail">
              <h3><i className="fas fa-concierge-bell"></i> Yangi Bron Yaratish</h3>
              <div className="form-group">
                <label htmlFor="bookingDate">Sana:</label>
                <input type="text" id="bookingDate" value={bookingDateInput} readOnly placeholder="Kalendardan tanlang" required />
              </div>
              <div className="form-group">
                <label htmlFor="numberOfGuests">Mehmonlar soni:</label>
                <input type="number" id="numberOfGuests" value={numberOfGuests} onChange={(e) => setNumberOfGuests(parseInt(e.target.value, 10) || 1)} min="1" max={venue.capacity} required />
                <small>Maksimal: {venue.capacity} kishi</small>
              </div>
              <button type="submit" className="button-primary" disabled={bookingLoading || !selectedDate}>
                {bookingLoading ? "Yuborilmoqda..." : "Bron Qilish"}
              </button>
            </form>
          )}
          {!user && <p className="auth-prompt"><RouterLink to="/login" state={{ from: `/venue/${venueId}` }}>Bron qilish</RouterLink> uchun tizimga kiring.</p>}
          {user && user.role !== 'Klient' && <p className="info-text">Faqat Klientlar ushbu sahifadan bron qilishi mumkin.</p>}
        </div>
      </div>

      <div className="venue-reviews-section-detail">
        <h2><i className="fas fa-comments"></i> Mijozlar Izohlari</h2>
        {reviews.length > 0 ? reviews.map(review => (
          <div key={review.review_id} className="review-item-detail">
            <div className="review-header">
                <span className="review-author">{review.user_fio || review.user_username}</span>
                <span className="review-rating">{'⭐'.repeat(review.rating)}</span>
            </div>
            <p className="review-comment">{review.comment}</p>
            <small className="review-date">{new Date(review.created_at).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}</small>
          </div>
        )) : <p>Hozircha bu to'yxona uchun izohlar yo'q.</p>}

        {user && user.role === 'Klient' && (
            <form onSubmit={handleReviewSubmit} className="review-form-detail">
              <h3><i className="fas fa-pencil-alt"></i> O'z Izohingizni Qoldiring</h3>
              <div className="form-group">
                <label htmlFor="reviewRating">Sizning Reytingingiz:</label>
                <select id="reviewRating" value={reviewRating} onChange={(e) => setReviewRating(parseInt(e.target.value, 10))}>
                    {[5,4,3,2,1].map(r => <option key={r} value={r}>{'⭐'.repeat(r)} ({r})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="reviewComment">Izohingiz:</label>
                <textarea id="reviewComment" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows="4" placeholder="To'yxona haqidagi fikrlaringiz..."></textarea>
              </div>
              <button type="submit" className="button-primary" disabled={reviewLoading}>
                {reviewLoading ? "Yuborilmoqda..." : "Izohni Yuborish"}
              </button>
            </form>
        )}
         {!user && <p className="auth-prompt"><RouterLink to="/login" state={{ from: `/venue/${venueId}` }}>Izoh qoldirish</RouterLink> uchun tizimga kiring.</p>}
      </div>
    </div>
  );
};
export default VenueDetailPage;