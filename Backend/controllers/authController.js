const db = require('../config/db');
const bcrypt = require('bcryptjs'); // Parol heshlash uchun
const jwt = require('jsonwebtoken'); // JWT token yaratish uchun

const JWT_SECRET = 'your_jwt_secret_key'; 
// Parolni heshlash
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
};

// Parolni solishtirish
const comparePassword = async (enteredPassword, hashedPassword) => {
    return await bcrypt.compare(enteredPassword, hashedPassword);
};

// JWT tokenini yaratish
const generateToken = (userId, roleId) => {
    return jwt.sign(
        { id: userId, role: roleId }, // Token tarkibiga foydalanuvchi IDsi va rolini qo'shamiz
        JWT_SECRET,
        { expiresIn: '1d' }
    );
};

const registerUser = async (req, res) => {
    const { fio, username, password, phone_number } = req.body;

    if (!fio || !username || !password || !phone_number) {
        return res.status(400).json({ success: false, message: "Iltimos, barcha maydonlarni to'ldiring" });
    }

    try {
        // Foydalanuvchi mavjudligini tekshirish (username yoki phone_number bo'yicha)
        const userExistsQuery = 'SELECT user_id FROM users WHERE username = $1 OR phone_number = $2';
        const { rows: existingUsers } = await db.query(userExistsQuery, [username, phone_number]);

        if (existingUsers.length > 0) {
            return res.status(400).json({ success: false, message: 'Bu username yoki telefon raqami allaqachon ro\'yxatdan o\'tgan' });
        }

        // Klient rolini ID sini olish (DBda 'Klient' roli oldindan mavjud deb faraz qilinadi)
        let roleResult;
        try {
            roleResult = await db.query("SELECT role_id FROM roles WHERE role_name = 'Klient'");
        } catch (dbError) {
            console.error("Rolni olishda DB xatoligi:", dbError);
            return res.status(500).json({ success: false, message: "Serverda rol topishda xatolik." });
        }
        
        if (!roleResult || roleResult.rows.length === 0) { // Tekshiruv kuchaytirildi
             return res.status(500).json({ success: false, message: "Standart 'Klient' roli topilmadi. Iltimos, administrator bilan bog'laning." });
        }
        const clientRoleId = roleResult.rows[0].role_id;

        const hashedPassword = await hashPassword(password); // Mahalliy funksiyadan foydalanish

        const insertUserQuery = `
            INSERT INTO users (fio, username, password_hash, phone_number, role_id, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, 'Aktiv', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING user_id, fio, username, phone_number, role_id, status;
        `;
        // `updated_at` ni ham CURRENT_TIMESTAMP bilan qo'shdik, chunki triggerlar yo'q
        const { rows: newUserRows } = await db.query(insertUserQuery, [fio, username, hashedPassword, phone_number, clientRoleId]);
        
        if (newUserRows.length === 0) {
            return res.status(500).json({ success: false, message: 'Foydalanuvchini yaratishda xatolik yuz berdi.' });
        }
        const newUser = newUserRows[0];

        res.status(201).json({
            success: true,
            message: "Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi!",
            user: {
                user_id: newUser.user_id,
                fio: newUser.fio,
                username: newUser.username,
                phone_number: newUser.phone_number,
                role_id: newUser.role_id,
            },
            token: generateToken(newUser.user_id, newUser.role_id), // Mahalliy funksiyadan foydalanish
        });

    } catch (error) {
        console.error("Register user error:", error);
        res.status(500).json({ success: false, message: 'Server xatoligi: Foydalanuvchini ro\'yxatdan o\'tkazib bo\'lmadi' });
    }
};



const loginUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Iltimos, username va parolni kiriting' });
    }

    try {
        const userQuery = 'SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.username = $1';
        const { rows: users } = await db.query(userQuery, [username]);

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Username yoki parol noto\'g\'ri' });
        }

        const user = users[0];

        if (user.status !== 'Aktiv') {
            return res.status(403).json({ success: false, message: 'Foydalanuvchi bloklangan yoki aktiv emas.' });
        }

        const isPasswordMatch = await comparePassword(password, user.password_hash); // Mahalliy funksiyadan foydalanish

        if (!isPasswordMatch) {
            return res.status(401).json({ success: false, message: 'Username yoki parol noto\'g\'ri' });
        }

        res.status(200).json({
            success: true,
            message: "Tizimga muvaffaqiyatli kirildi!",
            user: {
                user_id: user.user_id,
                fio: user.fio,
                username: user.username,
                phone_number: user.phone_number,
                role_id: user.role_id,
                role_name: user.role_name,
            },
            token: generateToken(user.user_id, user.role_id), // Mahalliy funksiyadan foydalanish
        });

    } catch (error) {
        console.error("Login user error:", error);
        res.status(500).json({ success: false, message: 'Server xatoligi: Tizimga kirib bo\'lmadi' });
    }
};

module.exports = {
    registerUser,
    loginUser,
};
