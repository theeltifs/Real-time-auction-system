const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  handleGooglePay,
  createStripeIntent,
  handlePayFastRedirect
} = require('../controllers/paymentController');

router.post('/googlepay', handleGooglePay);
router.post('/create-intent', protect, createStripeIntent);
router.get('/payfast-redirect/:auctionId', handlePayFastRedirect);

module.exports = router;
