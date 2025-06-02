const express = require("express");
const {
  addReview,
  getReviewsForVenue,
  updateMyReview,
  deleteReview,
} = require("../controllers/reviewController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Agar marshrutlar /api/venues/:venueId/reviews ko'rinishida bo'lsa, mergeParams kerak
const router = express.Router({ mergeParams: true });

// Izohlarni olish - public
router.get("/", getReviewsForVenue);

// Izoh qo'shish - faqat Klientlar uchun
router.post("/", protect, authorize("Klient"), addReview);

// Izohni yangilash va o'chirish
// Bu marshrutlarni /api/reviews/:reviewId qilib alohida ham qilish mumkin
router.put("/:reviewId", protect, authorize("Klient", "Admin"), updateMyReview); // Admin ham o'zgartirishi mumkinmi? Odatda yo'q. Faqat Klient o'zinikini.
// Agar Admin ham o'zgartira olsa, controllerda qo'shimcha tekshiruv kerak.
// Hozirgi controller faqat izoh egasiga ruxsat beradi.
router.delete(
  "/:reviewId",
  protect,
  authorize("Klient", "Admin"),
  deleteReview
);

module.exports = router;
