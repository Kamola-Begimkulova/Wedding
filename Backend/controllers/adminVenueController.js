const db = require('../config/db');

// @desc    Admin tomonidan barcha to'yxonalarni olish (kengaytirilgan filter va sortlash bilan)
// @route   GET /api/admin/venues
// @access  Private (Admin)
const getAllVenuesForAdmin = async (req, res) => {
    const { district_id, status_name, sort_by = 'v.created_at', order = 'DESC', search, capacity_min, capacity_max, price_min, price_max } = req.query;
    let queryParams = [];
    let baseQuery = `
        SELECT v.venue_id, v.name, v.address, v.capacity, v.price, v.phone_number AS venue_phone,
               d.district_name, vs.status_name, v.created_at, v.updated_at,
               owner.fio AS owner_fio, owner.phone_number AS owner_phone
        FROM venues v
        JOIN districts d ON v.district_id = d.district_id
        JOIN venue_statuses vs ON v.status_id = vs.status_id
        LEFT JOIN users owner ON v.owner_user_id = owner.user_id
    `;
    let whereClauses = [];
    let paramCount = 1;

    if (district_id) {
        whereClauses.push(`v.district_id = $${paramCount++}`);
        queryParams.push(district_id);
    }
    if (status_name) {
        whereClauses.push(`vs.status_name = $${paramCount++}`);
        queryParams.push(status_name);
    }
    if (search) {
        whereClauses.push(`(v.name ILIKE $${paramCount++} OR v.address ILIKE $${paramCount++})`);
        queryParams.push(`%${search}%`);
        queryParams.push(`%${search}%`); // Ikkinchi ILIKE uchun
    }
    if (capacity_min) {
        whereClauses.push(`v.capacity >= $${paramCount++}`);
        queryParams.push(capacity_min);
    }
    if (capacity_max) {
        whereClauses.push(`v.capacity <= $${paramCount++}`);
        queryParams.push(capacity_max);
    }
    if (price_min) {
        whereClauses.push(`v.price >= $${paramCount++}`);
        queryParams.push(price_min);
    }
    if (price_max) {
        whereClauses.push(`v.price <= $${paramCount++}`);
        queryParams.push(price_max);
    }


    if (whereClauses.length > 0) {
        baseQuery += " WHERE " + whereClauses.join(" AND ");
    }

    // Sortlash uchun xavfsiz ustun nomlarini tekshirish
    const allowedSortBy = ['v.name', 'v.price', 'v.capacity', 'v.created_at', 'd.district_name', 'vs.status_name'];
    const safeSortBy = allowedSortBy.includes(sort_by) ? sort_by : 'v.created_at';
    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    baseQuery += ` ORDER BY ${safeSortBy} ${safeOrder}`;

    try {
        const { rows } = await db.query(baseQuery, queryParams);
        res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error("Admin uchun to'yxonalarni olishda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: To'yxonalarni olib bo'lmadi" });
    }
};

// @desc    Admin tomonidan to'yxona statusini o'zgartirish (Tasdiqlash/Rad etish)
// @route   PUT /api/admin/venues/:id/status
// @access  Private (Admin)
const updateVenueStatusByAdmin = async (req, res) => {
    const { id: venue_id } = req.params;
    const { new_status_name } = req.body; // Masalan: 'Tasdiqlangan', 'Rad_etilgan'

    if (!new_status_name) {
        return res.status(400).json({ success: false, message: "Yangi status nomi ko'rsatilmagan." });
    }

    const validStatuses = ['Tasdiqlangan', 'Rad_etilgan', 'Kutilmoqda', 'Tasdiqlanmagan']; // 'Tasdiqlanmagan' ham bo'lishi mumkin
    if (!validStatuses.includes(new_status_name)) {
        return res.status(400).json({ success: false, message: "Noto'g'ri status nomi yuborildi." });
    }

    try {
        const venueResult = await db.query("SELECT status_id FROM venues WHERE venue_id = $1", [venue_id]);
        if (venueResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "To'yxona topilmadi." });
        }

        const newStatusResult = await db.query("SELECT status_id FROM venue_statuses WHERE status_name = $1", [new_status_name]);
        if (newStatusResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: `"${new_status_name}" statusi topilmadi.` });
        }
        const newStatusId = newStatusResult.rows[0].status_id;

        const updateQuery = `
            UPDATE venues SET status_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE venue_id = $2 RETURNING *;
        `;
        const { rows: updatedVenue } = await db.query(updateQuery, [newStatusId, venue_id]);

        // TODO: Agar to'yxona tasdiqlansa yoki rad etilsa, to'yxona egasiga xabar yuborish logikasi (email/sms)

        res.status(200).json({ success: true, message: "To'yxona statusi muvaffaqiyatli yangilandi.", data: updatedVenue[0] });

    } catch (error) {
        console.error("Admin tomonidan to'yxona statusini yangilashda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: To'yxona statusini yangilab bo'lmadi" });
    }
};

// @desc    Admin tomonidan to'yxonaga egasini biriktirish
// @route   PUT /api/admin/venues/:venueId/assign-owner
// @access  Private (Admin)
const assignOwnerToVenue = async (req, res) => {
    const { venueId } = req.params;
    const { owner_user_id } = req.body;

    if (!owner_user_id) {
        return res.status(400).json({ success: false, message: "To'yxona egasining IDsi ko'rsatilmagan." });
    }

    try {
        // To'yxona mavjudligini tekshirish
        const venueResult = await db.query("SELECT venue_id FROM venues WHERE venue_id = $1", [venueId]);
        if (venueResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "To'yxona topilmadi." });
        }

        // Foydalanuvchi (potensial ega) mavjudligini va uning rolini tekshirish
        const ownerResult = await db.query(
            "SELECT u.user_id, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = $1",
            [owner_user_id]
        );
        if (ownerResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Biriktirish uchun foydalanuvchi (ega) topilmadi." });
        }
        if (ownerResult.rows[0].role_name !== 'To_yxona_Egasi') {
            return res.status(400).json({ success: false, message: "Foydalanuvchi 'To_yxona_Egasi' rolida bo'lishi kerak." });
        }

        const updateQuery = `
            UPDATE venues SET owner_user_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE venue_id = $2 RETURNING *;
        `;
        const { rows: updatedVenue } = await db.query(updateQuery, [owner_user_id, venueId]);

        res.status(200).json({ success: true, message: "To'yxonaga ega muvaffaqiyatli biriktirildi.", data: updatedVenue[0] });

    } catch (error) {
        console.error("To'yxonaga ega biriktirishda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: To'yxonaga ega biriktirib bo'lmadi" });
    }
};

// @desc    Admin tomonidan to'yxona ma'lumotlarini (shu jumladan egasini) o'zgartirish
// @route   PUT /api/admin/venues/:id
// @access  Private (Admin)
// Eslatma: Bu funksiya venueController.js dagi updateVenue ga o'xshash, lekin faqat Admin uchun
// va owner_user_id ni ham o'zgartira olishi mumkin.
// Agar venueController.updateVenue yetarli bo'lsa, buni alohida qilish shart emas.
// Hozircha, bu yerda to'liqroq Admin nazoratini ko'rsatish uchun qoldiramiz.
const updateVenueDetailsByAdmin = async (req, res) => {
    const { id: venue_id } = req.params;
    const {
        name, district_id, address, capacity, price, phone_number,
        additional_info, status_id, main_image_url, latitude, longitude,
        owner_user_id // Admin egasini ham o'zgartirishi mumkin
    } = req.body;

    try {
        const venueResult = await db.query("SELECT venue_id FROM venues WHERE venue_id = $1", [venue_id]);
        if (venueResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Yangilash uchun to'yxona topilmadi" });
        }

        // Agar owner_user_id berilsa, uni tekshirish
        if (owner_user_id !== undefined) { // null ham bo'lishi mumkin (egani olib tashlash)
            if (owner_user_id !== null) {
                const ownerExists = await db.query(
                    "SELECT u.user_id FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = $1 AND r.role_name = 'To_yxona_Egasi'",
                    [owner_user_id]
                );
                if (ownerExists.rows.length === 0) {
                    return res.status(400).json({ success: false, message: "Ko'rsatilgan foydalanuvchi topilmadi yoki 'To_yxona_Egasi' rolida emas." });
                }
            }
        }
        
        // Agar status_id berilsa, uni tekshirish
        if (status_id) {
            const statusExists = await db.query("SELECT status_id FROM venue_statuses WHERE status_id = $1", [status_id]);
            if (statusExists.rows.length === 0) {
                 return res.status(400).json({ success: false, message: "Noto'g'ri status ID yuborildi." });
            }
        }


        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        // Dinamik ravishda yangilanadigan maydonlarni va ularning qiymatlarini yig'ish
        if (name !== undefined) { updateFields.push(`name = $${paramCount++}`); updateValues.push(name); }
        if (district_id !== undefined) { updateFields.push(`district_id = $${paramCount++}`); updateValues.push(district_id); }
        if (address !== undefined) { updateFields.push(`address = $${paramCount++}`); updateValues.push(address); }
        if (capacity !== undefined) { updateFields.push(`capacity = $${paramCount++}`); updateValues.push(capacity); }
        if (price !== undefined) { updateFields.push(`price = $${paramCount++}`); updateValues.push(price); }
        if (phone_number !== undefined) { updateFields.push(`phone_number = $${paramCount++}`); updateValues.push(phone_number); }
        if (additional_info !== undefined) { updateFields.push(`additional_info = $${paramCount++}`); updateValues.push(additional_info); }
        if (status_id !== undefined) { updateFields.push(`status_id = $${paramCount++}`); updateValues.push(status_id); }
        if (main_image_url !== undefined) { updateFields.push(`main_image_url = $${paramCount++}`); updateValues.push(main_image_url); }
        if (latitude !== undefined) { updateFields.push(`latitude = $${paramCount++}`); updateValues.push(latitude); }
        if (longitude !== undefined) { updateFields.push(`longitude = $${paramCount++}`); updateValues.push(longitude); }
        if (owner_user_id !== undefined) { updateFields.push(`owner_user_id = $${paramCount++}`); updateValues.push(owner_user_id); }


        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: "Yangilash uchun hech qanday ma'lumot berilmadi." });
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(venue_id); // Oxirgi parametr WHERE uchun venue_id

        const updateQuery = `
            UPDATE venues SET ${updateFields.join(", ")}
            WHERE venue_id = $${paramCount}
            RETURNING *;
        `;

        const { rows } = await db.query(updateQuery, updateValues);
        res.status(200).json({ success: true, message: "To'yxona ma'lumotlari Admin tomonidan muvaffaqiyatli yangilandi", data: rows[0] });

    } catch (error) {
        console.error("Admin tomonidan to'yxona ma'lumotlarini yangilashda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: To'yxona ma'lumotlarini yangilab bo'lmadi" });
    }
};


module.exports = {
    getAllVenuesForAdmin,
    updateVenueStatusByAdmin,
    assignOwnerToVenue,
    updateVenueDetailsByAdmin,
    // getVenueDetailsForAdmin (kelajakda bron kalendari bilan)
};