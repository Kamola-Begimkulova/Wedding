const db = require('../config/db');

// @desc    Yangi to'yxona yaratish
// @route   POST /api/venues
// @access  Private (To_yxona_Egasi, Admin)
const createVenue = async (req, res) => {
    const {
        name, district_id, address, capacity, price, phone_number,
        additional_info, main_image_url, latitude, longitude
    } = req.body;
    const owner_user_id = req.user.user_id; // Token orqali olingan foydalanuvchi IDsi
    const user_role = req.user.role_name;

    if (!name || !district_id || !address || !capacity || !price) {
        return res.status(400).json({ success: false, message: "Iltimos, barcha majburiy maydonlarni to'ldiring (nom, tuman, manzil, sig'im, narx)" });
    }

    try {
        // To'yxona statusini aniqlash (Admin qo'shsa 'Tasdiqlangan', To'yxona Egasi qo'shsa 'Kutilmoqda')
        let statusName = 'Kutilmoqda';
        if (user_role === 'Admin') {
            statusName = req.body.status_name || 'Tasdiqlangan'; // Admin statusni o'zi belgilashi mumkin
        }

        const statusResult = await db.query("SELECT status_id FROM venue_statuses WHERE status_name = $1", [statusName]);
        if (statusResult.rows.length === 0) {
            return res.status(500).json({ success: false, message: `"${statusName}" statusi topilmadi.` });
        }
        const status_id = statusResult.rows[0].status_id;

        const insertVenueQuery = `
            INSERT INTO venues (
                name, district_id, address, capacity, price, phone_number,
                additional_info, owner_user_id, status_id, main_image_url, latitude, longitude,
                created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *;
        `;
        const { rows } = await db.query(insertVenueQuery, [
            name, district_id, address, capacity, price, phone_number,
            additional_info, owner_user_id, status_id, main_image_url, latitude, longitude
        ]);

        res.status(201).json({ success: true, message: "To'yxona muvaffaqiyatli yaratildi", data: rows[0] });

    } catch (error) {
        console.error("To'yxona yaratishda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: To'yxonani yaratib bo'lmadi" });
    }
};

// @desc    Barcha (tasdiqlangan) to'yxonalarni olish
// @route   GET /api/venues
// @access  Public (lekin admin uchun boshqacha bo'lishi mumkin)
// controllers/venueController.js
const getAllVenues = async (req, res) => {
  try {
    const {
      search,
      district_id,
      capacity_min,
      capacity_max,
      price_min,
      price_max,
      sort_by = "v.name",
      order = "ASC"
    } = req.query;

    const statusResult = await db.query(
      "SELECT status_id FROM venue_statuses WHERE status_name = 'Tasdiqlangan'"
    );

    if (statusResult.rows.length === 0) {
      return res.status(500).json({ success: false, message: "'Tasdiqlangan' statusi topilmadi." });
    }

    const status_id = statusResult.rows[0].status_id;
    const values = [status_id];
    let conditions = ["v.status_id = $1"];
    let idx = 2;

    if (search) {
      conditions.push(`LOWER(v.name) LIKE $${idx}`);
      values.push(`%${search.toLowerCase()}%`);
      idx++;
    }

    if (district_id) {
      conditions.push(`v.district_id = $${idx}`);
      values.push(district_id);
      idx++;
    }

    if (capacity_min) {
      conditions.push(`v.capacity >= $${idx}`);
      values.push(capacity_min);
      idx++;
    }

    if (capacity_max) {
      conditions.push(`v.capacity <= $${idx}`);
      values.push(capacity_max);
      idx++;
    }

    if (price_min) {
      conditions.push(`v.price >= $${idx}`);
      values.push(price_min);
      idx++;
    }

    if (price_max) {
      conditions.push(`v.price <= $${idx}`);
      values.push(price_max);
      idx++;
    }

    const query = `
      SELECT v.venue_id, v.name, v.address, v.capacity, v.price, v.main_image_url, d.district_name
      FROM venues v
      JOIN districts d ON v.district_id = d.district_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY ${sort_by} ${order === "DESC" ? "DESC" : "ASC"};
    `;

    const result = await db.query(query, values);
    return res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error("Venue filterlashda xatolik:", error);
    return res.status(500).json({ success: false, message: "Ichki xatolik yuz berdi." });
  }
};


// @desc    Muayyan to'yxonani ID si bo'yicha olish
// @route   GET /api/venues/:id
// @access  Public
const getVenueById = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT v.*, d.district_name, vs.status_name AS venue_status,
                   owner.fio AS owner_fio, owner.phone_number AS owner_phone,
                   (SELECT ROUND(AVG(r.rating)) FROM reviews r WHERE r.venue_id = v.venue_id) AS average_rating,
                   (SELECT COUNT(r.review_id) FROM reviews r WHERE r.venue_id = v.venue_id) AS review_count
            FROM venues v
            JOIN districts d ON v.district_id = d.district_id
            JOIN venue_statuses vs ON v.status_id = vs.status_id
            LEFT JOIN users owner ON v.owner_user_id = owner.user_id
            WHERE v.venue_id = $1;
        `;
        const { rows } = await db.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "To'yxona topilmadi" });
        }
        
        // Klientlar uchun faqat 'Tasdiqlangan' to'yxonani ko'rsatish logikasi
        // Agar so'rov yuborayotgan autentifikatsiyadan o'tmagan foydalanuvchi bo'lsa yoki Klient bo'lsa
        // va to'yxona statusi 'Tasdiqlangan' bo'lmasa, xatolik qaytarish mumkin.
        // Misol:
        // if ((!req.user || req.user.role_name === 'Klient') && rows[0].venue_status !== 'Tasdiqlangan') {
        //     return res.status(403).json({ success: false, message: "Bu to'yxonani ko'rish uchun ruxsat yo'q yoki u tasdiqlanmagan." });
        // }

        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("To'yxonani ID bo'yicha olishda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: To'yxonani olib bo'lmadi" });
    }
}

// @desc    To'yxona ma'lumotlarini yangilash
// @access  Private (Admin yoki To_yxona_Egasi o'zinikini)
const updateVenue = async (req, res) => {
    const { id } = req.params;
    const {
        name, district_id, address, capacity, price, phone_number,
        additional_info, status_id, main_image_url, latitude, longitude
    } = req.body;
    const current_user_id = req.user.user_id;
    const current_user_role = req.user.role_name;

    try {
        // To'yxonani va uning egasini tekshirish
        const venueResult = await db.query("SELECT owner_user_id, status_id FROM venues WHERE venue_id = $1", [id]);
        if (venueResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Yangilash uchun to'yxona topilmadi" });
        }
        const venueData = venueResult.rows[0];

        // Ruxsatni tekshirish: Admin yoki to'yxona egasi
        if (current_user_role !== 'Admin' && venueData.owner_user_id !== current_user_id) {
            return res.status(403).json({ success: false, message: "Sizda bu to'yxonani yangilash uchun ruxsat yo'q" });
        }
        
        // Agar Admin statusni o'zgartirmasa, eski status qoladi
        // Agar To'yxona Egasi o'zgartirsa, status 'Kutilmoqda'ga o'tishi kerak (agar Admin o'zgartirmagan bo'lsa)
        let new_status_id = venueData.status_id;
        if (status_id) { // Agar yangi status_id so'rovda kelsa
            if (current_user_role === 'Admin') {
                new_status_id = status_id;
            } else { // To'yxona egasi statusni o'zgartirmoqchi bo'lsa, 'Kutilmoqda'ga o'tkazish logikasi
                const kutilmoqdaStatus = await db.query("SELECT status_id FROM venue_statuses WHERE status_name = 'Kutilmoqda'");
                if (kutilmoqdaStatus.rows.length > 0) {
                    new_status_id = kutilmoqdaStatus.rows[0].status_id;
                }
            }
        }


        const updateVenueQuery = `
            UPDATE venues SET
                name = COALESCE($1, name),
                district_id = COALESCE($2, district_id),
                address = COALESCE($3, address),
                capacity = COALESCE($4, capacity),
                price = COALESCE($5, price),
                phone_number = COALESCE($6, phone_number),
                additional_info = COALESCE($7, additional_info),
                status_id = COALESCE($8, status_id),
                main_image_url = COALESCE($9, main_image_url),
                latitude = COALESCE($10, latitude),
                longitude = COALESCE($11, longitude),
                updated_at = CURRENT_TIMESTAMP
            WHERE venue_id = $12
            RETURNING *;
        `;
        const { rows } = await db.query(updateVenueQuery, [
            name, district_id, address, capacity, price, phone_number,
            additional_info, new_status_id, main_image_url, latitude, longitude, id
        ]);

        if (rows.length === 0) {
             // Bu holat kamdan-kam yuz beradi, chunki yuqorida topilgan edi
            return res.status(404).json({ success: false, message: "To'yxonani yangilab bo'lmadi" });
        }

        res.status(200).json({ success: true, message: "To'yxona muvaffaqiyatli yangilandi", data: rows[0] });

    } catch (error) {
        console.error("To'yxonani yangilashda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: To'yxonani yangilab bo'lmadi" });
    }
};


//To'yxonani o'chirish
// Private (Admin)
const deleteVenue = async (req, res) => {
    const { id } = req.params;

    try {
        // O'chirishdan oldin to'yxona mavjudligini tekshirish (ixtiyoriy, DELETE o'zi 0 qaytaradi agar topilmasa)
        const venueExists = await db.query("SELECT venue_id FROM venues WHERE venue_id = $1", [id]);
        if (venueExists.rows.length === 0) {
            return res.status(404).json({ success: false, message: "O'chirish uchun to'yxona topilmadi" });
        }

        // Tegishli bronlar bo'lsa, ON DELETE CASCADE tufayli avtomatik o'chadi.
        // Tegishli suratlar bo'lsa, ON DELETE CASCADE tufayli avtomatik o'chadi.
        const { rowCount } = await db.query("DELETE FROM venues WHERE venue_id = $1", [id]);

        if (rowCount === 0) {
            // Bu holat ham kamdan-kam, yuqorida tekshirilgan.
            return res.status(404).json({ success: false, message: "To'yxonani o'chirib bo'lmadi yoki topilmadi" });
        }

        res.status(200).json({ success: true, message: "To'yxona muvaffaqiyatli o'chirildi" });
    } catch (error) {
        console.error("To'yxonani o'chirishda xatolik:", error);
        // Agar foreign key constraint xatoligi bo'lsa (masalan, bookings ON DELETE CASCADE bo'lmasa)
        if (error.code === '23503') { // foreign_key_violation
             return res.status(400).json({ success: false, message: "Bu to'yxonaga bog'liq bronlar mavjud. Avval ularni o'chiring."});
        }
        res.status(500).json({ success: false, message: "Server xatoligi: To'yxonani o'chirib bo'lmadi" });
    }
};


//To'yxona egasining o'ziga tegishli to'yxonalarni olish

//Private (Toyxona_Egasi)
const getMyVenues = async (req, res) => {
    const owner_user_id = req.user.user_id;

    try {
        const query = `
            SELECT v.*, d.district_name, vs.status_name AS venue_status
            FROM venues v
            JOIN districts d ON v.district_id = d.district_id
            JOIN venue_statuses vs ON v.status_id = vs.status_id
            WHERE v.owner_user_id = $1
            ORDER BY v.created_at DESC;
        `;
        const { rows } = await db.query(query, [owner_user_id]);
        res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error("Mening to'yxonalarimni olishda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: To'yxonalaringizni olib bo'lmadi" });
    }
};
const getVenueAvailabilityCalendar = async (req, res) => {
    const { venueId, year, month } = req.params;

    // Kiritilgan yil va oyni tekshirish
    const numericYear = parseInt(year, 10);
    const numericMonth = parseInt(month, 10); // JavaScript oylari 0-11, lekin URLda 1-12 keladi

    if (isNaN(numericYear) || isNaN(numericMonth) || numericMonth < 1 || numericMonth > 12 || numericYear < 2000 || numericYear > 2100) {
        return res.status(400).json({ success: false, message: "Noto'g'ri yil yoki oy formati yuborildi." });
    }

    // Oyning birinchi va oxirgi kunini aniqlash
    // JavaScriptda oylar 0 dan boshlanadi (0 - Yanvar, 11 - Dekabr)
    const startDate = new Date(numericYear, numericMonth - 1, 1);
    const endDate = new Date(numericYear, numericMonth, 0); // Keyingi oyning 0-kuni = joriy oyning oxirgi kuni

    try {
        // To'yxona mavjudligini tekshirish
        const venueExists = await db.query("SELECT venue_id, status_id FROM venues WHERE venue_id = $1", [venueId]);
        if (venueExists.rows.length === 0) {
            return res.status(404).json({ success: false, message: "To'yxona topilmadi." });
        }

        // Faqat 'Tasdiqlangan' yoki 'Kutilmoqda' statusidagi bronlarni hisobga olamiz
        // Chunki bekor qilingan bronlar kalendarda bo'sh kun sifatida ko'rinishi kerak.
        const bookedDatesQuery = `
            SELECT b.booking_date, bs.status_name AS booking_status,
                   u.fio AS client_fio, u.phone_number AS client_phone, b.number_of_guests
            FROM bookings b
            JOIN booking_statuses bs ON b.status_id = bs.status_id
            LEFT JOIN users u ON b.client_user_id = u.user_id -- Admin uchun klient ma'lumotlari
            WHERE b.venue_id = $1
              AND b.booking_date >= $2
              AND b.booking_date <= $3
              AND bs.status_name IN ('Tasdiqlangan', 'Kutilmoqda') -- Faqat aktiv yoki kutilayotgan bronlar
            ORDER BY b.booking_date ASC;
        `;
        const { rows: bookedDates } = await db.query(bookedDatesQuery, [venueId, startDate, endDate]);

        // Frontend uchun qulay formatda javob qaytarish
        // Har bir kun uchun: { date: 'YYYY-MM-DD', status: 'booked'/'pending', clientInfo: {...} (Admin uchun) }
        const calendarData = bookedDates.map(booking => {
            const dateOnly = booking.booking_date.toISOString().split('T')[0]; // Faqat sana qismini olish
            let dayData = {
                date: dateOnly,
                status: booking.booking_status === 'Tasdiqlangan' ? 'booked_confirmed' : 'booked_pending',
            };
            // Agar so'rov yuborayotgan Admin bo'lsa, qo'shimcha ma'lumotlarni qo'shish
            if (req.user && req.user.role_name === 'Admin') {
                dayData.client_fio = booking.client_fio;
                dayData.client_phone = booking.client_phone;
                dayData.number_of_guests = booking.number_of_guests;
            }
            return dayData;
        });

        res.status(200).json({
            success: true,
            venue_id: venueId,
            year: numericYear,
            month: numericMonth,
            calendar_data: calendarData
        });

    } catch (error) {
        console.error("To'yxona bandlik kalendarini olishda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: Kalendar ma'lumotlarini olib bo'lmadi." });
    }
};



module.exports = {
    createVenue,
    getAllVenues,
    getVenueById,
    updateVenue,
    deleteVenue,
    getMyVenues,
    getVenueAvailabilityCalendar
    // Kelajakda: getVenuesByDistrict, searchVenues va hk.
};