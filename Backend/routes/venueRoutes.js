// routes/venueRoutes.js

const express = require('express');
const {
    createVenue,                // To'yxona yaratish (controllers/venueController.js dan)
    getAllVenues,               // Barcha to'yxonalarni olish (filter va sortlash bilan)
    getVenueById,               // ID bo'yicha to'yxonani olish
    updateVenue,                // To'yxona ma'lumotlarini yangilash
    deleteVenue,                // To'yxonani o'chirish
    getMyVenues,                // To'yxona egasining o'z to'yxonalarini olish
    getVenueAvailabilityCalendar // To'yxona bandlik kalendarini olish
} = require('../controllers/venueController');

const { protect, authorize } = require('../middlewares/authMiddleware'); // Himoya middleware'lari

// Boshqa routerlarni import qilish (ichki marshrutlar uchun)
const venueImageRoutes = require('./venueImageRoutes'); // To'yxona suratlari uchun marshrutlar
const reviewRoutes = require('./reviewRoutes');       // To'yxona izohlari uchun marshrutlar

const router = express.Router();

// Public marshrutlar
// GET /api/venues?district_id=1&capacity_min=50&price_max=5000000&search=restoran&sort_by=v.price&order=DESC
router.get('/', getAllVenues); // Barcha to'yxonalarni olish (kengaytirilgan filter va saralash bilan)
router.get('/:id', getVenueById); // Muayyan to'yxonani ID si bo'yicha olish

// To'yxonaning bandlik kalendarini olish uchun marshrut
// Bu marshrut public, lekin controller ichida Admin uchun qo'shimcha ma'lumotlar qaytarilishi mumkin
router.get('/:venueId/calendar/:year/:month', getVenueAvailabilityCalendar);


// Ichki marshrutlar (Nested Routes)
// /api/venues/:venueId/images uchun marshrutlar
router.use('/:venueId/images', venueImageRoutes);

// /api/venues/:venueId/reviews uchun marshrutlar
router.use('/:venueId/reviews', reviewRoutes);


// Private marshrutlar (Token va kerakli rol talab qilinadi)

// Yangi to'yxona yaratish (Admin yoki To'yxona Egasi)
router.post('/', protect, authorize('Admin', 'Tuyxona_Egasi'), createVenue);

// To'yxona egasining o'ziga tegishli to'yxonalarini olish
router.get('/my-venues/list', protect, authorize('Tuyxona_Egasi'), getMyVenues);

// To'yxona ma'lumotlarini yangilash (Admin yoki To'yxona Egasi o'zinikini)
router.put('/:id', protect, authorize('Admin', 'Tuyxona_Egasi'), updateVenue);

// To'yxonani o'chirish (Faqat Admin)
router.delete('/:id', protect, authorize('Admin'), deleteVenue);


module.exports = router;
