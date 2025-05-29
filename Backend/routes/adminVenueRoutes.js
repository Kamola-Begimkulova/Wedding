const express = require('express');
const {
    getAllVenuesForAdmin,
    updateVenueStatusByAdmin,
    assignOwnerToVenue,
    updateVenueDetailsByAdmin
} = require('../controllers/adminVenueController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Barcha marshrutlar Admin uchun himoyalangan
router.use(protect);
router.use(authorize('Admin'));

router.get('/', getAllVenuesForAdmin);
router.put('/:id/status', updateVenueStatusByAdmin); // To'yxonani tasdiqlash/rad etish
router.put('/:venueId/assign-owner', assignOwnerToVenue);
router.put('/:id', updateVenueDetailsByAdmin); // To'yxona ma'lumotlarini to'liq yangilash (venueController.updateVenue dan farqli o'laroq owner_user_id ni ham o'zgartira oladi)

// To'yxonani o'chirish uchun venueRoutes.js dagi DELETE /api/venues/:id (Admin uchun) ishlatiladi.
// Yangi to'yxona qo'shish uchun venueRoutes.js dagi POST /api/venues (Admin uchun) ishlatiladi.

module.exports = router;