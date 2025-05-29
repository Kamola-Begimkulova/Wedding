// routes/bookingRoutes.js

const express = require('express');
const {
    createBooking,                // Yangi bron yaratish (controllers/bookingController.js dan)
    getMyBookings,                // Klientning o'z bronlarini olish
    cancelBooking,                // Bronni bekor qilish
    getAllBookingsForAdmin,       // Admin uchun barcha bronlarni olish (filter va sortlash bilan)
    getBookingsForVenueOwner,     // To'yxona egasi uchun bronlarni olish
    updateBookingStatusByAdmin    // Admin tomonidan bron statusini o'zgartirish
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middlewares/authMiddleware'); // Himoya middleware'lari

const router = express.Router();

// --- Klient uchun marshrutlar ---
// Yangi bron yaratish (Faqat 'Klient' roli uchun)
router.post('/', protect, authorize('Klient'), createBooking);

// Klientning o'ziga tegishli bronlarini olish (Faqat 'Klient' roli uchun)
router.get('/my-bookings', protect, authorize('Klient'), getMyBookings);


// --- Umumiy marshrut (bir nechta rol uchun) ---
// Bronni bekor qilish (Klient o'zinikini, To'yxona Egasi o'z to'yxonasidagini, Admin istalganini)
router.put('/:id/cancel', protect, authorize('Klient', 'To_yxona_Egasi', 'Admin'), cancelBooking);


// --- Admin uchun marshrutlar ---
// Admin uchun barcha bronlarni olish (kengaytirilgan filter va sortlash bilan)
// GET /api/bookings/admin/all?venue_id=1&district_id=2&status_id=3&date_from=2024-01-01&sort_by=sana&order=ASC
router.get('/admin/all', protect, authorize('Admin'), getAllBookingsForAdmin);

// Admin tomonidan bron statusini o'zgartirish (masalan, 'Kutilmoqda' -> 'Tasdiqlangan')
router.put('/admin/:bookingId/status', protect, authorize('Admin'), updateBookingStatusByAdmin);


// --- To'yxona Egasi uchun marshrutlar ---
// To'yxona egasi uchun o'z to'yxonasidagi bronlarni olish (Admin ham ko'rishi mumkin)
router.get('/venue-owner/:venueId', protect, authorize('To_yxona_Egasi', 'Admin'), getBookingsForVenueOwner);


module.exports = router;
