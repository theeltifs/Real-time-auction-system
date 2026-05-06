const express = require('express');
const router = express.Router();
const { bootstrapAdmin, setUserRole, getFlaggedBids } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// No auth — secret key protected — use once to create the first admin
router.post('/bootstrap', bootstrapAdmin);

// Admin only — change any user's role
router.put('/set-role', protect, adminOnly, setUserRole);

// Admin only — view all flagged bids with optional verdict filter and pagination
router.get('/flagged-bids', protect, adminOnly, getFlaggedBids);

module.exports = router;
