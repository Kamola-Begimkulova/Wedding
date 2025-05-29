// controllers/bookingController.js
const db = require('../config/db');

// @desc    Yangi bron yaratish
// @route   POST /api/bookings
// @access  Private (Klient)
const createBooking = async (req, res) => {
    const { venue_id, booking_date, number_of_guests } = req.body;
    const client_user_id = req.user.user_id; // Token orqali olingan klient IDsi

    if (!venue_id || !booking_date || !number_of_guests) {
        return res.status(400).json({ success: false, message: "Iltimos, barcha maydonlarni to'ldiring (to'yxona, sana, mehmonlar soni)" });
    }

    if (new Date(booking_date) < new Date().setHours(0,0,0,0) ) {
        return res.status(400).json({ success: false, message: "O'tgan sanaga bron qilib bo'lmaydi." });
    }

    try {
        // To'yxona mavjudligini va statusini tekshirish
        const venueResult = await db.query(
            "SELECT v.capacity, vs.status_name FROM venues v JOIN venue_statuses vs ON v.status_id = vs.status_id WHERE v.venue_id = $1",
            [venue_id]
        );
        if (venueResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "To'yxona topilmadi." });
        }
        if (venueResult.rows[0].status_name !== 'Tasdiqlangan') {
            return res.status(400).json({ success: false, message: "Bu to'yxona hozircha bron uchun mavjud emas (tasdiqlanmagan)." });
        }
        if (Number(number_of_guests) <= 0) {
            return res.status(400).json({ success: false, message: "Mehmonlar soni 0 dan katta bo'lishi kerak." });
        }
        if (Number(number_of_guests) > venueResult.rows[0].capacity) {
            return res.status(400).json({ success: false, message: `Mehmonlar soni (${number_of_guests}) to'yxona sig'imidan (${venueResult.rows[0].capacity}) oshmasligi kerak.` });
        }

        // Tanlangan sanada to'yxona band emasligini tekshirish
        const existingBookingQuery = `
            SELECT b.booking_id FROM bookings b
            JOIN booking_statuses bs ON b.status_id = bs.status_id
            WHERE b.venue_id = $1 AND b.booking_date = $2
            AND bs.status_name IN ('Tasdiqlangan', 'Kutilmoqda');
        `;
        const { rows: existingBookings } = await db.query(existingBookingQuery, [venue_id, booking_date]);

        if (existingBookings.length > 0) {
            return res.status(400).json({ success: false, message: "Tanlangan sanada bu to'yxona allaqachon band." });
        }

        const statusResult = await db.query("SELECT status_id FROM booking_statuses WHERE status_name = 'Kutilmoqda'");
        if (statusResult.rows.length === 0) {
            return res.status(500).json({ success: false, message: "'Kutilmoqda' bron statusi topilmadi." });
        }
        const kutilmoqdaStatusId = statusResult.rows[0].status_id;

        const insertBookingQuery = `
            INSERT INTO bookings (
                venue_id, client_user_id, booking_date, number_of_guests, status_id,
                created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *;
        `;
        const { rows } = await db.query(insertBookingQuery, [
            venue_id, client_user_id, booking_date, number_of_guests, kutilmoqdaStatusId
        ]);

        res.status(201).json({ success: true, message: "Bron muvaffaqiyatli yaratildi va ko'rib chiqish uchun yuborildi.", data: rows[0] });

    } catch (error) {
        console.error("Bron yaratishda xatolik:", error);
        if (error.code === '23505') { // unique_violation (venue_id, booking_date)
            return res.status(400).json({ success: false, message: "Tanlangan sanada bu to'yxona allaqachon band (unique constraint)." });
        }
        res.status(500).json({ success: false, message: "Server xatoligi: Bronni yaratib bo'lmadi" });
    }
};

// @desc    Klientning o'z bronlarini olish
// @route   GET /api/bookings/my-bookings
// @access  Private (Klient)
const getMyBookings = async (req, res) => {
    const client_user_id = req.user.user_id;
    try {
        const query = `
            SELECT b.booking_id, v.name AS venue_name, v.address AS venue_address, d.district_name,
                   b.booking_date, b.number_of_guests, bs.status_name AS booking_status, b.created_at
            FROM bookings b
            JOIN venues v ON b.venue_id = v.venue_id
            JOIN districts d ON v.district_id = d.district_id
            JOIN booking_statuses bs ON b.status_id = bs.status_id
            WHERE b.client_user_id = $1
            ORDER BY b.booking_date DESC;
        `;
        const { rows } = await db.query(query, [client_user_id]);
        res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error("Mening bronlarimni olishda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: Bronlaringizni olib bo'lmadi" });
    }
};

// @desc    Bronni bekor qilish (Klient, To'yxona Egasi, Admin)
// @route   PUT /api/bookings/:id/cancel
// @access  Private (Klient, To_yxona_Egasi, Admin)
const cancelBooking = async (req, res) => {
    const { id: booking_id } = req.params;
    const current_user_id = req.user.user_id;
    const current_user_role = req.user.role_name;

    try {
        const bookingResult = await db.query(
            `SELECT b.client_user_id, b.venue_id, v.owner_user_id, bs.status_name AS current_status, b.booking_date
             FROM bookings b
             JOIN venues v ON b.venue_id = v.venue_id
             JOIN booking_statuses bs ON b.status_id = bs.status_id
             WHERE b.booking_id = $1`, [booking_id]
        );

        if (bookingResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Bekor qilish uchun bron topilmadi." });
        }

        const booking = bookingResult.rows[0];

        // O'tib ketgan sanadagi bronni bekor qilib bo'lmaydi (Admin bundan mustasno)
        if (current_user_role !== 'Admin' && new Date(booking.booking_date) < new Date().setHours(0,0,0,0)) {
            return res.status(400).json({ success: false, message: "O'tib ketgan sanadagi bronni bekor qilib bo'lmaydi." });
        }

        const cancellableStatuses = ['Kutilmoqda', 'Tasdiqlangan'];
        if (!cancellableStatuses.includes(booking.current_status)) {
            return res.status(400).json({ success: false, message: `Bu bronni (${booking.current_status}) bekor qilib bo'lmaydi.` });
        }

        let newStatusName = '';
        if (current_user_role === 'Klient') {
            if (booking.client_user_id !== current_user_id) {
                return res.status(403).json({ success: false, message: "Siz faqat o'z bronlaringizni bekor qila olasiz." });
            }
            newStatusName = 'Bekor_qilingan_klient';
        } else if (current_user_role === 'To_yxona_Egasi') {
            if (booking.owner_user_id !== current_user_id) {
                return res.status(403).json({ success: false, message: "Siz faqat o'z to'yxonangizdagi bronlarni bekor qila olasiz." });
            }
            newStatusName = 'Bekor_qilingan_egasi';
        } else if (current_user_role === 'Admin') {
            newStatusName = 'Bekor_qilingan_admin';
        } else {
            return res.status(403).json({ success: false, message: "Sizda bu amalni bajarish uchun ruxsat yo'q." });
        }

        const statusResult = await db.query("SELECT status_id FROM booking_statuses WHERE status_name = $1", [newStatusName]);
        if (statusResult.rows.length === 0) {
            return res.status(500).json({ success: false, message: `"${newStatusName}" statusi topilmadi.` });
        }
        const newStatusId = statusResult.rows[0].status_id;

        const updateQuery = `
            UPDATE bookings SET status_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE booking_id = $2 RETURNING *;
        `;
        const { rows: updatedBooking } = await db.query(updateQuery, [newStatusId, booking_id]);

        res.status(200).json({ success: true, message: "Bron muvaffaqiyatli bekor qilindi.", data: updatedBooking[0] });

    } catch (error) {
        console.error("Bronni bekor qilishda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: Bronni bekor qilib bo'lmadi" });
    }
};


// @desc    Admin uchun barcha bronlarni olish (kengaytirilgan filter va sortlash bilan)
// @route   GET /api/bookings/admin/all
// @access  Private (Admin)
const getAllBookingsForAdmin = async (req, res) => {
    const {
        venue_id,       // To'yxona ID si bo'yicha filter
        district_id,    // Tuman ID si bo'yicha filter
        status_id,      // Bron statusi ID si bo'yicha filter
        client_search,  // Klient FIOsi yoki telefoni bo'yicha qidiruv
        date_from,      // Sana (dan) bo'yicha filter
        date_to,        // Sana (gacha) bo'yicha filter
        sort_by = 'b.booking_date', // Saralash ustuni (DB ustun nomi yoki quyidagi 'allowedSortBy' kaliti)
        order = 'DESC'              // Saralash tartibi ('ASC' yoki 'DESC')
    } = req.query;

    let queryParams = [];
    let baseQuery = `
        SELECT
            b.booking_id,
            v.name AS venue_name,
            v.venue_id AS venue_id_val,
            d.district_name,
            d.district_id AS district_id_val,
            u.fio AS client_fio,
            u.phone_number AS client_phone,
            b.booking_date,
            b.number_of_guests,
            bs.status_name AS booking_status,
            bs.status_id AS booking_status_id_val,
            b.created_at AS booking_created_at,
            b.updated_at AS booking_updated_at
        FROM bookings b
        JOIN venues v ON b.venue_id = v.venue_id
        JOIN districts d ON v.district_id = d.district_id
        JOIN users u ON b.client_user_id = u.user_id
        JOIN booking_statuses bs ON b.status_id = bs.status_id
    `;
    let whereClauses = [];
    let paramCount = 1;

    if (venue_id) {
        whereClauses.push(`b.venue_id = $${paramCount++}`);
        queryParams.push(venue_id);
    }
    if (district_id) {
        whereClauses.push(`v.district_id = $${paramCount++}`);
        queryParams.push(district_id);
    }
    if (status_id) {
        whereClauses.push(`b.status_id = $${paramCount++}`);
        queryParams.push(status_id);
    }
    if (client_search) {
        whereClauses.push(`(u.fio ILIKE $${paramCount} OR u.phone_number ILIKE $${paramCount})`);
        queryParams.push(`%${client_search}%`);
        paramCount++; // ILIKE uchun bitta parametr ishlatiladi, lekin $${paramCount} ni to'g'ri oshirish kerak
    }
    if (date_from) {
        whereClauses.push(`b.booking_date >= $${paramCount++}`);
        queryParams.push(date_from);
    }
    if (date_to) {
        whereClauses.push(`b.booking_date <= $${paramCount++}`);
        queryParams.push(date_to);
    }

    if (whereClauses.length > 0) {
        baseQuery += " WHERE " + whereClauses.join(" AND ");
    }

    // Saralash uchun xavfsiz ustun nomlarini tekshirish
    // "Programming.docx" talablari: Sana, To'yxona, Rayon, Status
    const allowedSortBy = {
        'sana': 'b.booking_date',
        'toyxona': 'v.name',
        'rayon': 'd.district_name',
        'status': 'bs.status_name',
        'id': 'b.booking_id',
        'created_at': 'b.created_at'
    };

    // Agar sort_by parametri allowedSortBy obyektida kalit sifatida mavjud bo'lsa,
    // o'sha kalitga mos qiymatni (DB ustun nomini) olamiz.
    // Aks holda, to'g'ridan-to'g'ri DB ustun nomini ishlatishga harakat qilamiz (ehtiyotkorlik bilan).
    // Yoki sukut bo'yicha 'b.booking_date' ni ishlatamiz.
    let effectiveSortBy = allowedSortBy[sort_by.toLowerCase()] || 'b.booking_date'; // Sukut bo'yicha sana

    // Xavfsizlik uchun, agar sort_by parametri to'g'ridan-to'g'ri ustun nomi bo'lsa,
    // uni ruxsat etilgan ustunlar ro'yxati bilan solishtirish mumkin.
    // Hozircha, allowedSortBy dagi kalitlar yoki sukut bo'yicha ishlaymiz.

    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    baseQuery += ` ORDER BY ${effectiveSortBy} ${safeOrder}, b.booking_id ${safeOrder === 'ASC' ? 'ASC' : 'DESC'}`;

    try {
        const { rows } = await db.query(baseQuery, queryParams);
        res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error("Admin uchun bronlarni olishda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: Bronlarni olib bo'lmadi" });
    }
};

// @desc    To'yxona egasi uchun o'z to'yxonasidagi bronlarni olish
// @route   GET /api/bookings/venue-owner/:venueId
// @access  Private (To_yxona_Egasi, Admin)
const getBookingsForVenueOwner = async (req, res) => {
    const { venueId } = req.params;
    const current_user_id = req.user.user_id;
    const current_user_role = req.user.role_name;

    try {
        const venueOwnerResult = await db.query("SELECT owner_user_id FROM venues WHERE venue_id = $1", [venueId]);
        if (venueOwnerResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "To'yxona topilmadi." });
        }

        if (current_user_role === 'To_yxona_Egasi' && venueOwnerResult.rows[0].owner_user_id !== current_user_id) {
            return res.status(403).json({ success: false, message: "Siz faqat o'z to'yxonangizdagi bronlarni ko'ra olasiz." });
        }

        const query = `
            SELECT b.booking_id, u.fio AS client_fio, u.phone_number AS client_phone,
                   b.booking_date, b.number_of_guests, bs.status_name AS booking_status,
                   b.created_at, b.updated_at
            FROM bookings b
            JOIN users u ON b.client_user_id = u.user_id
            JOIN booking_statuses bs ON b.status_id = bs.status_id
            WHERE b.venue_id = $1
            ORDER BY b.booking_date DESC;
        `;
        const { rows } = await db.query(query, [venueId]);
        res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error("To'yxona egasi uchun bronlarni olishda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: Bronlarni olib bo'lmadi" });
    }
};

// @desc    Admin tomonidan bron statusini o'zgartirish (masalan, 'Kutilmoqda' -> 'Tasdiqlangan')
// @route   PUT /api/bookings/admin/:bookingId/status
// @access  Private (Admin)
const updateBookingStatusByAdmin = async (req, res) => {
    const { bookingId } = req.params;
    const { new_status_name } = req.body;

    if (!new_status_name) {
        return res.status(400).json({ success: false, message: "Yangi status nomi ko'rsatilmagan." });
    }

    try {
        const bookingResult = await db.query("SELECT status_id FROM bookings WHERE booking_id = $1", [bookingId]);
        if (bookingResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Bron topilmadi." });
        }

        const newStatusResult = await db.query("SELECT status_id FROM booking_statuses WHERE status_name = $1", [new_status_name]);
        if (newStatusResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: `"${new_status_name}" statusi topilmadi.` });
        }
        const newStatusId = newStatusResult.rows[0].status_id;

        const updateQuery = `
            UPDATE bookings SET status_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE booking_id = $2 RETURNING *;
        `;
        const { rows: updatedBooking } = await db.query(updateQuery, [newStatusId, bookingId]);

        res.status(200).json({ success: true, message: "Bron statusi muvaffaqiyatli yangilandi.", data: updatedBooking[0] });

    } catch (error) {
        console.error("Admin tomonidan bron statusini yangilashda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: Bron statusini yangilab bo'lmadi" });
    }
};


module.exports = {
    createBooking,
    getMyBookings,
    cancelBooking,
    getAllBookingsForAdmin,
    getBookingsForVenueOwner,
    updateBookingStatusByAdmin,
};
