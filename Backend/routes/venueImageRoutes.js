const express = require("express");
const {
  uploadVenueImageHandler,
  getVenueImagesHandler,
  deleteVenueImageHandler,
  setMainVenueImageHandler,
} = require("../controllers/venueImageController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { uploadVenueImage } = require("../middleware/uploadMiddleware"); // Fayl yuklash middleware

const router = express.Router({ mergeParams: true }); // venueId ni olish uchun mergeParams

// Himoyalangan marshrutlar
router.post(
  "/",
  protect,
  authorize("Admin", "To_yxona_Egasi"),
  uploadVenueImage,
  uploadVenueImageHandler
);
router.delete(
  "/:imageId",
  protect,
  authorize("Admin", "To_yxona_Egasi"),
  deleteVenueImageHandler
);
router.put(
  "/:imageId/set-main",
  protect,
  authorize("Admin", "To_yxona_Egasi"),
  setMainVenueImageHandler
);

// Public marshrut (hamma ko'rishi mumkin)
router.get("/", getVenueImagesHandler);

module.exports = router;
