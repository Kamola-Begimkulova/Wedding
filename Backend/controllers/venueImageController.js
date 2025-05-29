const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// @desc    To'yxona uchun yangi surat yuklash
// @route   POST /api/venues/:venueId/images
// @access  Private (Admin, To_yxona_Egasi o'zinikiga)
const uploadVenueImageHandler = async (req, res) => {
    const { venueId } = req.params;
    const current_user_id = req.user.user_id;
    const current_user_role = req.user.role_name;

    if (!req.file) {
        return res.status(400).json({ success: false, message: "Yuklash uchun rasm fayli topilmadi." });
    }

    // Fayl yo'lini server uchun nisbiy qilib saqlash
    // Masalan: /uploads/venues/1/1678886400000-my_image.jpg
    // __dirname ../../public/uploads/venues/1/xxxx.jpg
    // req.file.path public/uploads/venues/1/xxxx.jpg
    const image_url = `/uploads/venues/${venueId}/${req.file.filename}`;

    try {
        // To'yxona mavjudligini va egasini tekshirish (agar To_yxona_Egasi yuklayotgan bo'lsa)
        const venueResult = await db.query("SELECT owner_user_id FROM venues WHERE venue_id = $1", [venueId]);
        if (venueResult.rows.length === 0) {
            // Agar to'yxona topilmasa, yuklangan faylni o'chirish
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: "Surat yuklash uchun to'yxona topilmadi." });
        }

        if (current_user_role === 'To_yxona_Egasi' && venueResult.rows[0].owner_user_id !== current_user_id) {
            fs.unlinkSync(req.file.path);
            return res.status(403).json({ success: false, message: "Siz faqat o'z to'yxonangizga surat yuklay olasiz." });
        }

        const insertImageQuery = `
            INSERT INTO venue_images (venue_id, image_url, uploaded_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            RETURNING *;
        `;
        const { rows } = await db.query(insertImageQuery, [venueId, image_url]);

        // Agar bu birinchi yuklangan rasm bo'lsa yoki asosiy rasm hali o'rnatilmagan bo'lsa,
        // uni venues.main_image_url ga o'rnatish
        const venueDetails = await db.query("SELECT main_image_url FROM venues WHERE venue_id = $1", [venueId]);
        if (!venueDetails.rows[0].main_image_url) {
            await db.query("UPDATE venues SET main_image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE venue_id = $2", [image_url, venueId]);
            rows[0].is_main = true; // Javobga qo'shimcha ma'lumot
        }


        res.status(201).json({ success: true, message: "To'yxona surati muvaffaqiyatli yuklandi", data: rows[0] });

    } catch (error) {
        console.error("To'yxona suratini yuklashda xatolik:", error);
        // Xatolik yuz berganda yuklangan faylni o'chirish
        if (req.file && req.file.path) {
             try { fs.unlinkSync(req.file.path); } catch (e) { console.error("Faylni o'chirishda xatolik:", e); }
        }
        res.status(500).json({ success: false, message: "Server xatoligi: Suratni yuklab bo'lmadi" });
    }
};

// @desc    To'yxonaning barcha suratlarini olish
// @route   GET /api/venues/:venueId/images
// @access  Public
const getVenueImagesHandler = async (req, res) => {
    const { venueId } = req.params;
    try {
        const { rows } = await db.query("SELECT image_id, image_url, uploaded_at FROM venue_images WHERE venue_id = $1 ORDER BY uploaded_at DESC", [venueId]);
        res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error("To'yxona suratlarini olishda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: Suratlarni olib bo'lmadi" });
    }
};

// @desc    To'yxona suratini o'chirish
// @route   DELETE /api/venues/:venueId/images/:imageId
// @access  Private (Admin, To_yxona_Egasi o'zinikini)
const deleteVenueImageHandler = async (req, res) => {
    const { venueId, imageId } = req.params;
    const current_user_id = req.user.user_id;
    const current_user_role = req.user.role_name;

    try {
        // Suratni va unga bog'liq to'yxonani tekshirish
        const imageResult = await db.query(
            "SELECT vi.image_url, v.owner_user_id, v.main_image_url FROM venue_images vi JOIN venues v ON vi.venue_id = v.venue_id WHERE vi.image_id = $1 AND vi.venue_id = $2",
            [imageId, venueId]
        );

        if (imageResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "O'chirish uchun surat topilmadi." });
        }
        const image_data = imageResult.rows[0];

        if (current_user_role === 'To_yxona_Egasi' && image_data.owner_user_id !== current_user_id) {
            return res.status(403).json({ success: false, message: "Siz faqat o'z to'yxonangizdagi suratlarni o'chira olasiz." });
        }

        // Faylni serverdan o'chirish
        const filePath = path.join(__dirname, `../../public${image_data.image_url}`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Ma'lumotlar bazasidan o'chirish
        await db.query("DELETE FROM venue_images WHERE image_id = $1", [imageId]);

        // Agar o'chirilgan rasm asosiy rasm bo'lsa, venues.main_image_url ni tozalash
        // yoki boshqa bir rasmni asosiy qilib belgilash (bu yerda tozalaymiz)
        if (image_data.main_image_url === image_data.image_url) {
            // Qolgan rasmlardan birini asosiy qilish (eng oxirgi yuklangani)
            const remainingImages = await db.query(
                "SELECT image_url FROM venue_images WHERE venue_id = $1 ORDER BY uploaded_at DESC LIMIT 1",
                [venueId]
            );
            const newMainImageUrl = remainingImages.rows.length > 0 ? remainingImages.rows[0].image_url : null;
            await db.query("UPDATE venues SET main_image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE venue_id = $2", [newMainImageUrl, venueId]);
        }

        res.status(200).json({ success: true, message: "To'yxona surati muvaffaqiyatli o'chirildi." });

    } catch (error) {
        console.error("To'yxona suratini o'chirishda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: Suratni o'chirib bo'lmadi" });
    }
};

// @desc    Suratni asosiy qilib belgilash
// @route   PUT /api/venues/:venueId/images/:imageId/set-main
// @access  Private (Admin, To_yxona_Egasi o'zinikiga)
const setMainVenueImageHandler = async (req, res) => {
    const { venueId, imageId } = req.params;
    const current_user_id = req.user.user_id;
    const current_user_role = req.user.role_name;

    try {
        const imageResult = await db.query(
            "SELECT vi.image_url, v.owner_user_id FROM venue_images vi JOIN venues v ON vi.venue_id = v.venue_id WHERE vi.image_id = $1 AND vi.venue_id = $2",
            [imageId, venueId]
        );

        if (imageResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Asosiy qilish uchun surat topilmadi." });
        }
        const image_data = imageResult.rows[0];

        if (current_user_role === 'To_yxona_Egasi' && image_data.owner_user_id !== current_user_id) {
            return res.status(403).json({ success: false, message: "Siz faqat o'z to'yxonangizdagi suratni asosiy qila olasiz." });
        }

        await db.query(
            "UPDATE venues SET main_image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE venue_id = $2",
            [image_data.image_url, venueId]
        );

        res.status(200).json({ success: true, message: "Surat muvaffaqiyatli asosiy qilib belgilandi.", data: { main_image_url: image_data.image_url } });

    } catch (error) {
        console.error("Suratni asosiy qilishda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: Suratni asosiy qilib bo'lmadi" });
    }
};


module.exports = {
    uploadVenueImageHandler,
    getVenueImagesHandler,
    deleteVenueImageHandler,
    setMainVenueImageHandler
};