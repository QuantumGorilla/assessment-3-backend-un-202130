const express = require('express');

const router = express.Router();

const {
  createUser,
  getUserById,
  updateUser,
  deactivateUser,
  loginUser,
  getAllUsers,
  updatePassword,
  sendResetPassword,
  resetPassword,
} = require('../controllers/users');

const { authMiddleware } = require('../middlewares/authMiddleware');
const { paginationMiddleware } = require('../middlewares/paginationMiddleware');

router.get('/', authMiddleware, paginationMiddleware, getAllUsers);

router.post('/', createUser);
router.post('/login', loginUser);

router.get('/:id', authMiddleware, getUserById);
router.put('/:id', authMiddleware, updateUser);
router.delete('/:id', authMiddleware, deactivateUser);
router.post('/update_password', authMiddleware, updatePassword);
router.post('/send_password_reset', sendResetPassword);
router.post('/reset_password', resetPassword);
module.exports = router;
