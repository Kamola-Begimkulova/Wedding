const db = require('../config/db');
const addReview = async (req, res) => {
    const { venueId } = req.params; // Marshrutdan venueId ni olamiz
    const { rating, comment } = req.body;
    const user_id = req.user.user_id; // Token orqali olingan foydalanuvchi IDsi

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: "Reyting 1 dan 5 gacha bo'lishi kerak." });
    }

    try {
        // Foydalanuvchi bu to'yxonaga avval izoh qoldirganmi tekshirish
        const existingReview = await db.query(
            "SELECT review_id FROM reviews WHERE venue_id = $1 AND user_id = $2",
            [venueId, user_id]
        );

        if (existingReview.rows.length > 0) {
            return res.status(400).json({ success: false, message: "Siz bu to'yxonaga allaqachon izoh qoldirgansiz." });
        }

        // Foydalanuvchi bu to'yxonani bron qilganmi tekshirish (ixtiyoriy, lekin tavsiya etiladi)
        // Masalan, faqat 'Bo_lib_o_tgan' statusidagi bronlar uchun izoh qoldirishga ruxsat berish
        const successfulBooking = await db.query(
            `SELECT b.booking_id FROM bookings b
             JOIN booking_statuses bs ON b.status_id = bs.status_id
             WHERE b.venue_id = $1 AND b.client_user_id = $2 AND bs.status_name = 'Bo_lib_o_tgan'`,
            [venueId, user_id]
        );
        if (successfulBooking.rows.length === 0) {
            // Agar qat'iy qoida bo'lsa:
            // return res.status(403).json({ success: false, message: "Izoh qoldirish uchun avval ushbu to'yxonada tadbir o'tkazgan bo'lishingiz kerak." });
            // Hozircha bu tekshiruvni o'tkazib yuboramiz, lekin loyiha talablariga qarab qo'shish mumkin.
        }


        const insertReviewQuery = `
            INSERT INTO reviews (venue_id, user_id, rating, comment, created_at, updated_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *;
        `;
        const { rows } = await db.query(insertReviewQuery, [venueId, user_id, rating, comment]);

        res.status(201).json({ success: true, message: "Izoh muvaffaqiyatli qo'shildi", data: rows[0] });

    } catch (error) {
        console.error("Izoh qo'shishda xatolik:", error);
        if (error.code === '23503') { // Foreign key violation (venue_id yoki user_id topilmasa)
            return res.status(404).json({ success: false, message: "To'yxona yoki foydalanuvchi topilmadi." });
        }
        if (error.code === '23505') { // Unique constraint violation (venue_id, user_id)
             return res.status(400).json({ success: false, message: "Siz bu to'yxonaga allaqachon izoh qoldirgansiz (unique constraint)." });
        }
        res.status(500).json({ success: false, message: "Server xatoligi: Izohni qo'shib bo'lmadi" });
    }
};

// @desc    Muayyan to'yxonaning barcha izohlarini olish
// @route   GET /api/venues/:venueId/reviews
// @access  Public
const getReviewsForVenue = async (req, res) => {
    const { venueId } = req.params;
    try {
        const query = `
            SELECT r.review_id, r.rating, r.comment, r.created_at, r.updated_at,
                   u.fio AS user_fio, u.username AS user_username
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.venue_id = $1
            ORDER BY r.created_at DESC;
        `;
        const { rows } = await db.query(query, [venueId]);
        res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error("To'yxona izohlarini olishda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: Izohlarni olib bo'lmadi" });
    }
};

// @desc    Foydalanuvchining o'z izohini yangilash
// @route   PUT /api/reviews/:reviewId  (yoki /api/venues/:venueId/reviews/:reviewId)
// @access  Private (Izoh egasi)
const updateMyReview = async (req, res) => {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const user_id = req.user.user_id;

    if (!rating && !comment) {
        return res.status(400).json({ success: false, message: "Yangilash uchun hech bo'lmaganda reyting yoki izoh kerak." });
    }
    if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({ success: false, message: "Reyting 1 dan 5 gacha bo'lishi kerak." });
    }

    try {
        const currentReview = await db.query("SELECT user_id FROM reviews WHERE review_id = $1", [reviewId]);
        if (currentReview.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Izoh topilmadi." });
        }
        if (currentReview.rows[0].user_id !== user_id) {
            return res.status(403).json({ success: false, message: "Siz faqat o'z izohingizni yangilay olasiz." });
        }

        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        if (rating) { updateFields.push(`rating = $${paramCount++}`); updateValues.push(rating); }
        if (comment !== undefined) { updateFields.push(`comment = $${paramCount++}`); updateValues.push(comment); } // comment bo'sh string bo'lishi mumkin

        if (updateFields.length === 0) {
             return res.status(400).json({ success: false, message: "Yangilash uchun ma'lumot yo'q." });
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(reviewId); // Oxirgi parametr WHERE uchun

        const updateQuery = `
            UPDATE reviews SET ${updateFields.join(", ")}
            WHERE review_id = $${paramCount} RETURNING *;
        `;

        const { rows } = await db.query(updateQuery, updateValues);
        res.status(200).json({ success: true, message: "Izoh muvaffaqiyatli yangilandi", data: rows[0] });

    } catch (error) {
        console.error("Izohni yangilashda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: Izohni yangilab bo'lmadi" });
    }
};

// @desc    Foydalanuvchining o'z izohini yoki Admin tomonidan izohni o'chirish
// @route   DELETE /api/reviews/:reviewId (yoki /api/venues/:venueId/reviews/:reviewId)
// @access  Private (Izoh egasi, Admin)
const deleteReview = async (req, res) => {
    const { reviewId } = req.params;
    const current_user_id = req.user.user_id;
    const current_user_role = req.user.role_name;

    try {
        const reviewResult = await db.query("SELECT user_id FROM reviews WHERE review_id = $1", [reviewId]);
        if (reviewResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "O'chirish uchun izoh topilmadi." });
        }

        // Ruxsatni tekshirish: Izoh egasi yoki Admin
        if (current_user_role !== 'Admin' && reviewResult.rows[0].user_id !== current_user_id) {
            return res.status(403).json({ success: false, message: "Sizda bu izohni o'chirish uchun ruxsat yo'q." });
        }

        await db.query("DELETE FROM reviews WHERE review_id = $1", [reviewId]);
        res.status(200).json({ success: true, message: "Izoh muvaffaqiyatli o'chirildi." });

    } catch (error) {
        console.error("Izohni o'chirishda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: Izohni o'chirib bo'lmadi" });
    }
};


module.exports = {
    addReview,
    getReviewsForVenue,
    updateMyReview,
    deleteReview
};