const express = require('express');

const { getAllUsers, addUser, deleteUser } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const router = express.Router();
const { register, login, getMe } = require('../controllers/userController');

// just Admin only routes.
router.get('/', protect, adminOnly, getAllUsers);     // View users
router.post('/', protect, adminOnly, addUser);       // Add user
router.delete('/:id', protect, adminOnly, deleteUser); // Delete user
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
