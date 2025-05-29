const db = require('../config/db');
const bcrypt = require('bcryptjs'); // Parol heshlash uchun (authController'dan ko'chirish yoki umumiy utils qilish mumkin)

// Yordamchi funksiya: Parolni heshlash (authController'da ham bor, DRY uchun utils/passwordUtils.js ga chiqarish yaxshiroq)
const hashPasswordLocal = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

// @desc    Admin tomonidan yangi foydalanuvchi yaratish (ayniqsa To'yxona Egasi)
// @route   POST /api/admin/users
// @access  Private (Admin)
const createUserByAdmin = async (req, res) => {
    const { fio, username, password, phone_number, role_name, status = 'Aktiv' } = req.body;

    if (!fio || !username || !password || !phone_number || !role_name) {
        return res.status(400).json({ success: false, message: "Iltimos, barcha maydonlarni to'ldiring (FIO, username, parol, telefon, rol)" });
    }

    try {
        // Foydalanuvchi mavjudligini tekshirish
        const userExistsQuery = 'SELECT user_id FROM users WHERE username = $1 OR phone_number = $2';
        const { rows: existingUsers } = await db.query(userExistsQuery, [username, phone_number]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ success: false, message: 'Bu username yoki telefon raqami allaqachon mavjud.' });
        }

        // Rol ID sini olish
        const roleResult = await db.query("SELECT role_id FROM roles WHERE role_name = $1", [role_name]);
        if (roleResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: `"${role_name}" nomli rol topilmadi.` });
        }
        const role_id = roleResult.rows[0].role_id;

        const hashedPassword = await hashPasswordLocal(password);

        const insertUserQuery = `
            INSERT INTO users (fio, username, password_hash, phone_number, role_id, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING user_id, fio, username, phone_number, role_id, status;
        `;
        const { rows } = await db.query(insertUserQuery, [fio, username, hashedPassword, phone_number, role_id, status]);

        res.status(201).json({ success: true, message: "Foydalanuvchi Admin tomonidan muvaffaqiyatli yaratildi", data: rows[0] });

    } catch (error) {
        console.error("Admin tomonidan foydalanuvchi yaratishda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: Foydalanuvchini yaratib bo'lmadi" });
    }
};

// @desc    Admin tomonidan barcha foydalanuvchilarni olish (filterlash bilan)
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsersByAdmin = async (req, res) => {
    const { role_name, status, search } = req.query;
    let queryParams = [];
    let baseQuery = `
        SELECT u.user_id, u.fio, u.username, u.phone_number, r.role_name, u.status, u.created_at, u.updated_at
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
    `;
    let whereClauses = [];

    if (role_name) {
        queryParams.push(role_name);
        whereClauses.push(`r.role_name = $${queryParams.length}`);
    }
    if (status) {
        queryParams.push(status);
        whereClauses.push(`u.status = $${queryParams.length}`);
    }
    if (search) {
        queryParams.push(`%${search}%`);
        whereClauses.push(`(u.fio ILIKE $${queryParams.length} OR u.username ILIKE $${queryParams.length} OR u.phone_number ILIKE $${queryParams.length})`);
    }

    if (whereClauses.length > 0) {
        baseQuery += " WHERE " + whereClauses.join(" AND ");
    }
    baseQuery += " ORDER BY u.created_at DESC";

    try {
        const { rows } = await db.query(baseQuery, queryParams);
        res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error("Admin tomonidan foydalanuvchilarni olishda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: Foydalanuvchilarni olib bo'lmadi" });
    }
};

// @desc    Admin tomonidan foydalanuvchi ma'lumotlarini ID bo'yicha olish
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
const getUserByIdAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT u.user_id, u.fio, u.username, u.phone_number, r.role_name, u.status, u.created_at, u.updated_at
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.user_id = $1;
        `;
        const { rows } = await db.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });
        }
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Admin tomonidan foydalanuvchini ID bo'yicha olishda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: Foydalanuvchini olib bo'lmadi" });
    }
};

// @desc    Admin tomonidan foydalanuvchi ma'lumotlarini yangilash
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
const updateUserByAdmin = async (req, res) => {
    const { id } = req.params;
    const { fio, username, phone_number, role_name, status, password } = req.body;

    try {
        // Foydalanuvchi mavjudligini tekshirish
        const userResult = await db.query("SELECT user_id, username, phone_number FROM users WHERE user_id = $1", [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Yangilash uchun foydalanuvchi topilmadi" });
        }
        const currentUserData = userResult.rows[0];

        // Agar username o'zgartirilsa, yangi username band emasligini tekshirish
        if (username && username !== currentUserData.username) {
            const { rows: existingUserByUsername } = await db.query("SELECT user_id FROM users WHERE username = $1 AND user_id != $2", [username, id]);
            if (existingUserByUsername.length > 0) {
                return res.status(400).json({ success: false, message: "Bu username allaqachon boshqa foydalanuvchi tomonidan band." });
            }
        }
        // Agar telefon raqami o'zgartirilsa, yangi raqam band emasligini tekshirish
        if (phone_number && phone_number !== currentUserData.phone_number) {
            const { rows: existingUserByPhone } = await db.query("SELECT user_id FROM users WHERE phone_number = $1 AND user_id != $2", [phone_number, id]);
            if (existingUserByPhone.length > 0) {
                return res.status(400).json({ success: false, message: "Bu telefon raqami allaqachon boshqa foydalanuvchi tomonidan band." });
            }
        }

        let role_id_to_update;
        if (role_name) {
            const roleResult = await db.query("SELECT role_id FROM roles WHERE role_name = $1", [role_name]);
            if (roleResult.rows.length === 0) {
                return res.status(400).json({ success: false, message: `"${role_name}" nomli rol topilmadi.` });
            }
            role_id_to_update = roleResult.rows[0].role_id;
        }

        let hashedPasswordToUpdate;
        if (password) {
            hashedPasswordToUpdate = await hashPasswordLocal(password);
        }

        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        if (fio !== undefined) { updateFields.push(`fio = $${paramCount++}`); updateValues.push(fio); }
        if (username !== undefined) { updateFields.push(`username = $${paramCount++}`); updateValues.push(username); }
        if (phone_number !== undefined) { updateFields.push(`phone_number = $${paramCount++}`); updateValues.push(phone_number); }
        if (role_id_to_update !== undefined) { updateFields.push(`role_id = $${paramCount++}`); updateValues.push(role_id_to_update); }
        if (status !== undefined) { updateFields.push(`status = $${paramCount++}`); updateValues.push(status); }
        if (hashedPasswordToUpdate !== undefined) { updateFields.push(`password_hash = $${paramCount++}`); updateValues.push(hashedPasswordToUpdate); }
        
        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: "Yangilash uchun hech qanday ma'lumot berilmadi." });
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(id); // Oxirgi parametr WHERE uchun user_id

        const updateQuery = `
            UPDATE users SET ${updateFields.join(", ")}
            WHERE user_id = $${paramCount}
            RETURNING user_id, fio, username, phone_number, role_id, status;
        `;

        const { rows } = await db.query(updateQuery, updateValues);

        res.status(200).json({ success: true, message: "Foydalanuvchi ma'lumotlari muvaffaqiyatli yangilandi", data: rows[0] });

    } catch (error) {
        console.error("Admin tomonidan foydalanuvchini yangilashda xatolik:", error);
        res.status(500).json({ success: false, message: "Server xatoligi: Foydalanuvchini yangilab bo'lmadi" });
    }
};

// @desc    Admin tomonidan foydalanuvchini o'chirish
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUserByAdmin = async (req, res) => {
    const { id } = req.params;
    const adminUserId = req.user.user_id; // O'zini o'zi o'chirmasligi uchun

    if (parseInt(id, 10) === adminUserId) {
        return res.status(400).json({ success: false, message: "Admin o'zini o'zi o'chira olmaydi." });
    }

    try {
        // Foydalanuvchiga bog'liq to'yxonalar (owner_user_id) yoki bronlar (client_user_id) bo'lsa,
        // ON DELETE SET NULL yoki ON DELETE CASCADE qanday ishlashiga e'tibor berish kerak.
        // Hozircha, users jadvalidagi foreign keylar ON DELETE CASCADE emas (roles uchun).
        // venues.owner_user_id -> ON DELETE SET NULL
        // bookings.client_user_id -> ON DELETE CASCADE

        // Agar foydalanuvchi to'yxona egasi bo'lsa va unga biriktirilgan to'yxonalar bo'lsa,
        // bu to'yxonalarning owner_user_id si NULL bo'ladi.
        // Agar foydalanuvchi klient bo'lsa va uning bronlari bo'lsa, bronlar o'chib ketadi.

        const { rowCount } = await db.query("DELETE FROM users WHERE user_id = $1", [id]);

        if (rowCount === 0) {
            return res.status(404).json({ success: false, message: "O'chirish uchun foydalanuvchi topilmadi" });
        }

        res.status(200).json({ success: true, message: "Foydalanuvchi muvaffaqiyatli o'chirildi" });
    } catch (error) {
        console.error("Admin tomonidan foydalanuvchini o'chirishda xatolik:", error);
        // Agar foreign key bilan bog'liq muammo bo'lsa (masalan, roles jadvalida ON DELETE RESTRICT bo'lsa)
        // if (error.code === '23503') { ... }
        res.status(500).json({ success: false, message: "Server xatoligi: Foydalanuvchini o'chirib bo'lmadi" });
    }
};


module.exports = {
    createUserByAdmin,
    getAllUsersByAdmin,
    getUserByIdAdmin,
    updateUserByAdmin,
    deleteUserByAdmin,
};