require('dotenv').config(); // .env faylidagi o'zgaruvchilarni yuklash uchun
const express = require('express');
const cors = require('cors'); // Cross-Origin Resource Sharing uchun

// Ma'lumotlar bazasi ulanishini import qilish
const db = require('./config/db');

const authRoutes = require('./routes/authRoutes'); 
const venueRoutes = require('./routes/venueRoutes'); 
const bookingRoutes = require('./routes/bookingRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const adminVenueRoutes = require('./routes/adminVenueRoutes'); 
const venueImageRoutes = require('./routes/venueImageRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

// Express ilovasini yaratish
const app = express();
app.use(cors()); // Barcha domenlardan so'rovlarga ruxsat berish
const path = require('path');
// Asosiy middleware'lardan foydalanish
app.use(express.json()); // Kiruvchi JSON formatidagi so'rovlarni tushunish uchun
app.use(express.urlencoded({ extended: true })); // Kiruvchi URL-encoded so'rovlarni tushunish uchun


// Static fayllar uchun (yuklangan rasmlarni ko'rsatish uchun)
// __dirname joriy fayl (server.js) joylashgan papka
app.use('/public', express.static(path.join(__dirname, 'public'))); // YANGI QATOR

// API Route'larini ulash
app.use('/api/auth', authRoutes); 
app.use('/api/venues', venueRoutes); 
app.use('/api/bookings', bookingRoutes); 
app.use('/api/admin/users', adminUserRoutes); 
app.use('/api/admin/venues', adminVenueRoutes);
app.use('/api/venueimage', venueImageRoutes);
app.use('/api/reviews', reviewRoutes);


// Test uchun oddiy route
app.get('/api/test', (req, res) => {
    res.status(200).json({
        success: true,
        message: "API muvaffaqiyatli ishlamoqda! To'yxona Bron API ga xush kelibsiz!"
    });
});




// Serverni ishga tushirish uchun portni sozlash
const PORT = process.env.PORT || 5000;

// Serverni tinglash
app.listen(PORT, () => {
    console.log(`Server ${PORT}-portda ishga tushdi`);
    // Ma'lumotlar bazasiga ulanishni tekshirish
    db.query('SELECT NOW()', (err, dbRes) => {
        if (err) {
            console.error('Xatolik: Malumotlar bazasiga ulanib bolmadi.', err.stack);
        } else {
            console.log('Malumotlar bazasiga muvaffaqiyatli ulanildi.');
        }
    });
});