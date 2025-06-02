import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'; // Link va useLocation qo'shildi
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal'; // Modal komponentini import qilish

// VenueCalendar komponenti (siz taqdim etgan)
const VenueCalendar = ({ venueId, year, month, onDateSelect, bookedDatesInfo, user }) => { // user prop qo'shildi
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0:Yakshanba, 1:Dushanba

    const today = new Date();
    today.setHours(0,0,0,0);

    const dates = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        dates.push(<div key={`empty-${i}`} className="border p-2 text-center opacity-50 h-16 md:h-20"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month - 1, day);
        let cellClasses = "border p-2 text-center cursor-pointer hover:bg-blue-100 transition-colors duration-150 flex flex-col justify-center items-center h-16 md:h-20";
        let isBooked = false;
        let bookingStatus = ''; 

        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const bookingInfo = bookedDatesInfo.find(b => b.date === dateStr);

        if (bookingInfo) {
            isBooked = true;
            bookingStatus = bookingInfo.status;
            // Ranglar talabga ko'ra [cite: 529]
            if (bookingStatus === 'booked_confirmed' || bookingStatus === 'Tasdiqlangan') cellClasses += " bg-red-200 text-red-700 font-semibold"; // Bron qilingan
            else if (bookingStatus === 'booked_pending' || bookingStatus === 'Kutilmoqda') cellClasses += " bg-yellow-200 text-yellow-700 font-semibold"; // Kutilmoqda
            else cellClasses += " bg-gray-200 text-gray-600"; // Boshqa statuslar (agar bo'lsa)
        } else if (currentDate < today) {
             cellClasses += " bg-gray-100 text-gray-400 cursor-not-allowed line-through"; // O'tib ketgan
        } else {
            cellClasses += " bg-green-100 hover:bg-green-200 text-green-700 font-semibold"; // Bo'sh kun
        }
        
        dates.push(
            <div 
                key={day} 
                className={cellClasses}
                onClick={() => !isBooked && currentDate >= today && onDateSelect(currentDate)}
            >
                <span className="text-lg">{day}</span>
                {bookingInfo && user?.role_name === 'Admin' && ( // Admin uchun qo'shimcha ma'lumot [cite: 530]
                    <div className="text-xs mt-1 text-gray-600">
                        {bookingInfo.client_fio?.split(' ')[0] || 'Bron'} ({bookingInfo.number_of_guests} k.)
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-7 gap-1 text-sm md:text-base">
            {['Yak', 'Du', 'Se', 'Cho', 'Pay', 'Ju', 'Sha'].map(d => <div key={d} className="font-semibold text-center p-2 text-gray-600">{d}</div>)}
            {dates}
        </div>
    );
};

// ReviewEditForm komponenti (Modal ichida ishlatiladi)
const ReviewEditForm = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const [rating, setRating] = useState(initialData.rating);
  const [comment, setComment] = useState(initialData.comment);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) { alert("Reyting 1-5 oralig'ida bo'lishi kerak."); return; }
    onSubmit({ rating, comment });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="edit_rating" className="block text-sm font-medium text-gray-700">Reyting</label>
        <select id="edit_rating" value={rating} onChange={(e) => setRating(parseInt(e.target.value))} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm bg-white focus:ring-indigo-500 focus:border-indigo-500">
          {[1,2,3,4,5].map(r => <option key={r} value={r}>{r} ★</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="edit_comment" className="block text-sm font-medium text-gray-700">Izoh</label>
        <textarea id="edit_comment" value={comment} onChange={(e) => setComment(e.target.value)} rows="3" className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required></textarea>
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300">Bekor qilish</button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm disabled:opacity-50">
          {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </div>
    </form>
  );
};


const VenueDetailsPage = () => {
  const { id: venueId } = useParams();
  const { isAuthenticated, user } = useAuth(); 
  const navigate = useNavigate();
  const location = useLocation(); // Izoh uchun login redirectiga

  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [bookedDatesInfo, setBookedDatesInfo] = useState([]); 
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  const [selectedDate, setSelectedDate] = useState(null);
  const [numberOfGuests, setNumberOfGuests] = useState(1);

  // Izohlar uchun state'lar
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [isEditReviewModalOpen, setIsEditReviewModalOpen] = useState(false);


  const fetchVenueDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/venues/${venueId}`); //
      setVenue(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "To'yxona ma'lumotlarini yuklashda xatolik");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  const fetchCalendarData = useCallback(async (year, month) => {
    if(!venueId) return;
    setLoadingCalendar(true);
    try {
        const response = await api.get(`/venues/${venueId}/calendar/${year}/${month}`); //
        setBookedDatesInfo(response.data.calendar_data || []);
    } catch (err) {
        console.error("Kalendar ma'lumotlarini yuklashda xatolik:", err);
    } finally {
        setLoadingCalendar(false);
    }
  }, [venueId]);

  const fetchReviews = useCallback(async () => {
    if (!venueId) return;
    setLoadingReviews(true);
    setReviewError('');
    try {
        const response = await api.get(`/venues/${venueId}/reviews`); //
        setReviews(response.data.data || []);
    } catch (err) {
        setReviewError("Izohlarni yuklashda xatolik: " + (err.response?.data?.message || err.message));
    } finally {
        setLoadingReviews(false);
    }
  }, [venueId]);

  useEffect(() => {
    fetchVenueDetails();
    fetchReviews(); // Izohlarni ham yuklash
  }, [fetchVenueDetails, fetchReviews]);

  useEffect(() => {
    if (venue) {
        fetchCalendarData(currentYear, currentMonth);
    }
  }, [venue, currentYear, currentMonth, fetchCalendarData]);

  const handleDateSelect = (date) => {
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      alert("Bron qilish uchun tizimga kirishingiz kerak.");
      navigate('/login', { state: { from: location } }); // from: location
      return;
    }
     // Foydalanuvchi (Klient) rolini tekshirish
    if (user?.role_name !== 'Klient') {
        alert("Faqat 'Klient' rolidagi foydalanuvchilar bron qilishi mumkin.");
        return;
    }
    if (!selectedDate) {
      alert("Iltimos, bron qilish uchun sanani tanlang.");
      return;
    }
    if (Number(numberOfGuests) <= 0 || (venue && Number(numberOfGuests) > venue.capacity) ) { // venue null emasligini tekshirish
      alert(`Mehmonlar soni 1 dan ${venue?.capacity || '?'} gacha bo'lishi kerak.`);
      return;
    }

    try {
      const bookingData = {
        venue_id: parseInt(venueId, 10), // venueId ni songa o'tkazish
        booking_date: selectedDate,
        number_of_guests: Number(numberOfGuests)
      }; //
      const response = await api.post('/bookings', bookingData); // [cite: 19, 22]
      if (response.data.success) {
        alert("To'yxona muvaffaqiyatli bron qilindi! Arizangiz ko'rib chiqish uchun yuborildi.");
        setSelectedDate(null);
        setNumberOfGuests(1);
        fetchCalendarData(currentYear, currentMonth); 
      } else {
        alert(response.data.message || "Bron qilishda xatolik.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Bron qilishda server xatoligi.");
      console.error("Booking error:", err);
    }
  };
  
  const changeMonth = (offset) => {
    let newMonth = currentMonth + offset;
    let newYear = currentYear;
    if (newMonth > 12) {
        newMonth = 1;
        newYear++;
    } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSelectedDate(null); 
  };

  // Izohlar bilan ishlash funksiyalari
  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setNewReview(prev => ({ ...prev, [name]: name === 'rating' ? parseInt(value, 10) : value }));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || user?.role_name !== 'Klient') {
        alert("Izoh qoldirish uchun 'Klient' sifatida tizimga kirishingiz kerak.");
        navigate('/login', { state: { from: location } });
        return;
    } // [cite: 30]
    if (newReview.rating < 1 || newReview.rating > 5) {
        alert("Reyting 1 dan 5 gacha bo'lishi kerak."); // [cite: 346]
        return;
    }
    setIsSubmittingReview(true);
    setReviewError('');
    try {
        const response = await api.post(`/venues/${venueId}/reviews`, newReview); //
        if (response.data.success) {
            alert("Izohingiz muvaffaqiyatli qo'shildi!");
            setNewReview({ rating: 0, comment: '' });
            fetchReviews(); 
        } else {
            setReviewError(response.data.message || "Izohni qo'shishda xatolik.");
        }
    } catch (err) {
        setReviewError(err.response?.data?.message || "Server xatoligi: Izohni qo'shib bo'lmadi.");
        if (err.response?.data?.message.includes("allaqachon izoh qoldirgansiz")) { // [cite: 348, 358]
             // Bu xabarni foydalanuvchiga ko'rsatish
        }
    } finally {
        setIsSubmittingReview(false);
    }
  };

  const handleOpenEditReviewModal = (review) => {
    setEditingReview(review);
    setIsEditReviewModalOpen(true);
  };

  const handleCloseEditReviewModal = () => {
    setEditingReview(null);
    setIsEditReviewModalOpen(false);
  };

  const handleUpdateReview = async (updatedReviewData) => {
    if (!editingReview) return;
    setIsSubmittingReview(true); 
    setReviewError('');
    try {
        // Backend API: PUT /api/venues/:venueId/reviews/:reviewId
        const response = await api.put(`/venues/${venueId}/reviews/${editingReview.review_id}`, {
            rating: updatedReviewData.rating,
            comment: updatedReviewData.comment
        });
        if (response.data.success) {
            alert("Izohingiz muvaffaqiyatli yangilandi!");
            handleCloseEditReviewModal();
            fetchReviews();
        } else {
            setReviewError(response.data.message || "Izohni yangilashda xatolik.");
        }
    } catch (err) {
        setReviewError(err.response?.data?.message || "Server xatoligi.");
    } finally {
        setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm("Haqiqatan ham bu izohni o'chirmoqchimisiz?")) {
        setReviewError('');
        try {
            // Backend API: DELETE /api/venues/:venueId/reviews/:reviewId
            await api.delete(`/venues/${venueId}/reviews/${reviewId}`);
            alert("Izoh muvaffaqiyatli o'chirildi!");
            fetchReviews();
        } catch (err) {
            setReviewError(err.response?.data?.message || "Izohni o'chirishda xatolik.");
        }
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-[calc(100vh-150px)]"><p className="text-xl text-gray-600">Yuklanmoqda...</p></div>;
  if (error && !venue) return <div className="text-center py-10"><p className="text-xl text-red-600 bg-red-50 p-4 rounded-md">Xatolik: {error}</p></div>;
  if (!venue) return <div className="text-center py-10"><p className="text-xl text-gray-500">To'yxona topilmadi.</p></div>;

  const { name, address, district_name, capacity, price, phone_number, additional_info, main_image_url, average_rating, review_count, venue_status } = venue;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-xl rounded-lg overflow-hidden md:flex">
        <div className="md:w-1/2">
             <img 
                src={main_image_url ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${main_image_url}` : 'https://via.placeholder.com/600x450/cccccc/969696?text=To\'yxona+Rasmi'} 
                alt={name} 
                className="w-full h-64 md:h-full object-cover"
            />
        </div>
        <div className="md:w-1/2 p-6 lg:p-8">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 mb-2">{name}</h1>
          <p className="text-gray-500 text-sm mb-4">Status: <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${venue_status === 'Tasdiqlangan' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{venue_status}</span></p>
          
          {review_count > 0 && (
            <div className="flex items-center mb-4">
              <span className="text-yellow-400 flex">
                {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-5 h-5 ${i < Math.round(average_rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                ))}
              </span>
              <span className="ml-2 text-gray-600 text-sm">({average_rating?.toFixed(1)} / {review_count} sharh)</span>
            </div>
          )}

          <p className="text-gray-700 mb-2"><strong className="font-medium text-gray-800">Manzil:</strong> {address}, {district_name}</p>
          <p className="text-gray-700 mb-2"><strong className="font-medium text-gray-800">Sig'imi:</strong> {capacity} kishigacha</p>
          <p className="text-3xl font-bold text-indigo-600 my-4">{price?.toLocaleString()} so'm <span className="text-base font-normal text-gray-600">/ kishi</span></p>
          {phone_number && <p className="text-gray-700 mb-2"><strong className="font-medium text-gray-800">Telefon:</strong> <a href={`tel:${phone_number}`} className="text-indigo-600 hover:underline">{phone_number}</a></p>}
          {additional_info && <div className="mt-4 bg-slate-50 p-4 rounded-md"><h4 className="font-medium text-gray-800 mb-1">Qo'shimcha ma'lumot:</h4><p className="text-gray-700 text-sm">{additional_info}</p></div>}
        </div>
      </div>

      <div className="mt-8 p-6 bg-white shadow-xl rounded-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-5">Bandlik Kalendari va Bron Qilish</h2>
        <div className="flex items-center justify-between mb-5">
            <button onClick={() => changeMonth(-1)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md transition-colors">&lt; Oldingi</button>
            <h3 className="text-xl font-semibold text-indigo-600">{new Date(currentYear, currentMonth -1).toLocaleString('uz-UZ', { month: 'long', year: 'numeric' })}</h3>
            <button onClick={() => changeMonth(1)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md transition-colors">Keyingi &gt;</button>
        </div>
        {loadingCalendar ? <div className="text-center py-5 text-gray-500">Kalendar yuklanmoqda...</div> : <VenueCalendar venueId={venueId} year={currentYear} month={currentMonth} onDateSelect={handleDateSelect} bookedDatesInfo={bookedDatesInfo} user={user} />}

        {selectedDate && (
            <div className="mt-8 p-6 border border-indigo-200 rounded-lg bg-indigo-50">
                <h3 className="text-xl font-semibold text-indigo-700 mb-4">Tanlangan sana uchun bron: {selectedDate}</h3>
                <div className="mb-4">
                    <label htmlFor="numberOfGuests" className="block text-sm font-medium text-gray-700 mb-1">Mehmonlar soni:</label>
                    <input 
                        type="number" 
                        id="numberOfGuests"
                        value={numberOfGuests}
                        onChange={(e) => setNumberOfGuests(e.target.value)}
                        min="1"
                        max={capacity}
                        className="mt-1 w-full md:w-1/2 lg:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <button 
                    onClick={handleBooking}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-sm transition duration-150 disabled:opacity-60"
                    disabled={user?.role_name !== 'Klient'} 
                >
                    Bron Qilish
                </button>
                 {!isAuthenticated && <p className="text-red-600 text-sm mt-2">Bron qilish uchun <Link to="/login" state={{ from: location }} className="font-medium hover:underline">tizimga kiring</Link>.</p>}
                 {isAuthenticated && user?.role_name !== 'Klient' && <p className="text-red-600 text-sm mt-2">Faqat "Klient" rolidagi foydalanuvchilar bron qilishi mumkin.</p>}
            </div>
        )}
      </div>
      
      <div className="mt-10 pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Mijozlar Izohlari</h2>
        {loadingReviews && <p className="text-center text-gray-500">Izohlar yuklanmoqda...</p>}
        {reviewError && !loadingReviews && <p className="text-red-500 bg-red-100 p-3 rounded-md text-center mb-4">{reviewError}</p>}
        
        {!loadingReviews && reviews.length > 0 && (
          <div className="space-y-6 mb-8">
            {reviews.map(review => (
              <div key={review.review_id} className="p-5 border rounded-lg bg-slate-50 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <p className="font-semibold text-gray-800 mr-3">{review.user_fio || review.user_username}</p>
                    <span className="text-yellow-400 flex">
                        {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        ))}
                    </span>
                  </div>
                  {(user && (user.user_id === review.user_id || user.role_name === 'Admin')) && (
                    <div className="flex space-x-2">
                      {user.user_id === review.user_id && (
                        <button 
                            onClick={() => handleOpenEditReviewModal(review)}
                            className="text-xs text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
                            title="Tahrirlash"
                        >
                            ✏️ Tahrir
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteReview(review.review_id)}
                        className="text-xs text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                        title="O'chirish"
                      >
                        🗑️ O'chirish
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-gray-700 leading-relaxed mb-1 text-sm">{review.comment}</p>
                <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString('uz-UZ', {year: 'numeric', month: 'long', day: 'numeric'})}</p>
              </div>
            ))}
          </div>
        )}
        {!loadingReviews && reviews.length === 0 && !reviewError && (
          <p className="text-gray-500 mb-8 text-center">Hozircha bu to'yxona uchun izohlar mavjud emas.</p>
        )}

        {isAuthenticated && user?.role_name === 'Klient' && ( // [cite: 30]
          <form onSubmit={handleReviewSubmit} className="p-6 border rounded-lg bg-white shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">O'z Izohingizni Qoldiring</h3>
            {reviewError && !isSubmittingReview && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{reviewError}</p>}
            <div className="mb-4">
              <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">Sizning Reytingingiz</label>
              <select 
                  name="rating" id="rating" value={newReview.rating} onChange={handleReviewChange} required
                  className="mt-1 block w-full md:w-auto p-2.5 border border-gray-300 rounded-md shadow-sm bg-white focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="0" disabled>Reytingni tanlang...</option>
                  <option value="5">5 ★ (Ajoyib!)</option>
                  <option value="4">4 ★ (Yaxshi)</option>
                  <option value="3">3 ★ (O'rtacha)</option>
                  <option value="2">2 ★ (Yomon)</option>
                  <option value="1">1 ★ (Juda yomon)</option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">Izohingiz</label>
              <textarea 
                  name="comment" id="comment" value={newReview.comment} onChange={handleReviewChange} rows="4" required
                  className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Bu to'yxona haqidagi fikrlaringiz..."
              ></textarea>
            </div>
            <button type="submit" disabled={isSubmittingReview}
              className="w-full sm:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-sm disabled:opacity-60 transition duration-150">
              {isSubmittingReview ? "Yuborilmoqda..." : "Izohni Yuborish"}
            </button>
          </form>
        )}
        {!isAuthenticated && 
            <p className="text-sm text-gray-600 text-center p-4 border rounded-lg bg-yellow-50">
                Izoh qoldirish uchun <Link to="/login" state={{from: location}} className="text-indigo-600 hover:underline font-medium">tizimga kiring</Link>.
            </p>
        }
      </div>

      {/* Izohni tahrirlash uchun Modal */}
      <Modal isOpen={isEditReviewModalOpen} onClose={handleCloseEditReviewModal} title="Izohni Tahrirlash">
       {editingReview && (
         <ReviewEditForm 
           initialData={editingReview} 
           onSubmit={handleUpdateReview} 
           onCancel={handleCloseEditReviewModal}
           isSubmitting={isSubmittingReview} 
         />
       )}
      </Modal>
    </div>
  );
};

export default VenueDetailsPage;