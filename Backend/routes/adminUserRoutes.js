const express = require('express');
const {
    createUserByAdmin,
    getAllUsersByAdmin,
    getUserByIdAdmin,
    updateUserByAdmin,
    deleteUserByAdmin
} = require('../controllers/adminUserController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Barcha marshrutlar Admin uchun himoyalangan
router.use(protect);
router.use(authorize('Admin'));

router.post('/', createUserByAdmin);
router.get('/', getAllUsersByAdmin);
router.get('/:id', getUserByIdAdmin);
router.put('/:id', updateUserByAdmin);
router.delete('/:id', deleteUserByAdmin);

module.exports = router;