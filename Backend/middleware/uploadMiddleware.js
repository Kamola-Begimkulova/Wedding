const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Yuklanadigan joyni va fayl nomini sozlash
const venueImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const venueId = req.params.venueId || req.params.id || 'temp_venue'; // Agar venueId bo'lmasa
        const uploadPath = path.join(__dirname, `../../public/uploads/venues/${venueId}`);
        // Papka mavjudligini tekshirish va yaratish
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Fayl nomini unikal qilish uchun vaqt belgisini qo'shamiz
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});

// Fayl turini tekshirish (faqat rasmlar)
const imageFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Faqat rasm fayllarini yuklash mumkin!'), false);
    }
};

const uploadVenueImage = multer({
    storage: venueImageStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB fayl hajmi chegarasi
}).single('venueImage'); // Frontend dan 'venueImage' nomi bilan keladigan fayl

// Bir nechta fayl yuklash uchun (agar kerak bo'lsa)
// const uploadMultipleVenueImages = multer({
//     storage: venueImageStorage,
//     fileFilter: imageFileFilter,
//     limits: { fileSize: 5 * 1024 * 1024 }
// }).array('venueImages', 5); // 'venueImages' nomi bilan maksimal 5 ta rasm

module.exports = { uploadVenueImage };