const jwt = require('jsonwebtoken');
const db = require('../config/db'); // DB ulanishini import qilish

const JWT_SECRET = 'your_jwt_secret_key'; 
// Foydalanuvchini himoyalash (token mavjudligini va yaroqliligini tekshirish)
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
 
            token = req.headers.authorization.split(' ')[1];

            // Tokenni tekshirish
            const decoded = jwt.verify(token, JWT_SECRET);

            // Foydalanuvchini ma'lumotlar bazasidan olish (parolsiz)
            // Rol nomini ham olish uchun JOIN qilamiz
            const userQuery = `
                SELECT u.user_id, u.fio, u.username, u.phone_number, u.role_id, u.status, r.role_name
                FROM users u
                JOIN roles r ON u.role_id = r.role_id
                WHERE u.user_id = $1;
            `;
            const { rows } = await db.query(userQuery, [decoded.id]);

            if (rows.length === 0) {
                return res.status(401).json({ success: false, message: 'Avtorizatsiyadan o\'tilmagan, foydalanuvchi topilmadi' });
            }

            if (rows[0].status !== 'Aktiv') {
                return res.status(401).json({ success: false, message: 'Foydalanuvchi bloklangan yoki aktiv emas.' });
            }

            req.user = rows[0]; // req obyektiga foydalanuvchi ma'lumotlarini qo'shish
            next(); // Keyingi middleware yoki route handlerga o'tish
        } catch (error) {
            console.error('Token xatoligi:', error);
            return res.status(401).json({ success: false, message: 'Avtorizatsiyadan o\'tilmagan, token yaroqsiz' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Avtorizatsiyadan o\'tilmagan, token mavjud emas' });
    }
};

// Rollar bo'yicha ruxsat berish
// Masalan: authorize('Admin', 'To_yxona_Egasi')
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role_name) {
            // Bu holat `protect` middleware to'g'ri ishlamagan bo'lsa yuz berishi mumkin
            return res.status(401).json({ success: false, message: 'Avtorizatsiyadan o\'tilmagan' });
        }
        if (!roles.includes(req.user.role_name)) {
            return res.status(403).json({ success: false, message: `Sizda (${req.user.role_name}) ushbu amalni bajarish uchun ruxsat yo'q` });
        }
        next();
    };
};

module.exports = {
    protect,
    authorize,
};