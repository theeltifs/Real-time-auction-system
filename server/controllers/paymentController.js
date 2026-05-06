const dotenv = require('dotenv');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const asyncHandler = require('express-async-handler');
const Auction = require('../models/Auction');

// POST /api/payments/googlepay — charges via legacy Stripe Charges API (deprecated)
const handleGooglePay = asyncHandler(async (req, res) => {
  const { tokenId, auctionId } = req.body;

  const auction = await Auction.findById(auctionId);
  if (!auction) return res.status(404).json({ message: 'Auction not found' });

  const charge = await stripe.charges.create({
    amount: auction.currentBid * 100,
    currency: 'usd',
    source: tokenId,
    description: `Auction Payment for ${auction.title}`,
  });

  if (charge.status === 'succeeded') {
    auction.isPaid = true;
    auction.paymentMethod = 'googlepay';
    auction.paymentDetails = {
      transactionId: charge.id,
      paidAt: new Date(),
    };
    await auction.save();
    return res.json({ success: true });
  }

  res.status(400).json({ message: 'Charge failed' });
});

// POST /api/payments/create-intent — creates a PaymentIntent, frontend confirms it
const createStripeIntent = asyncHandler(async (req, res) => {
  const { auctionId, paymentMethodId } = req.body;
  const auction = await Auction.findById(auctionId);

  if (!auction || auction.isPaid) {
    return res.status(400).json({ message: 'Invalid or already paid auction.' });
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: auction.currentBid * 100,
    currency: 'usd',
    payment_method: paymentMethodId,
    confirm: false,
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: { auctionId }
  });

  res.json({ clientSecret: paymentIntent.client_secret });
});

// GET /api/payments/payfast-redirect/:auctionId
const handlePayFastRedirect = asyncHandler(async (req, res) => {
  const auctionId = req.params.auctionId;
  const auction = await Auction.findById(auctionId);
  if (!auction) return res.status(404).json({ message: 'Auction not found' });

  const merchantId = 'your-merchant-id';
  const secureKey = 'your-secure-key';
  const amount = auction.currentBid.toFixed(2);

  const params = {
    merchant_id: merchantId,
    amount,
    order_id: auctionId,
    return_url: 'http://localhost:3000/payment-success',
    cancel_url: 'http://localhost:3000/payment-cancel',
    notify_url: 'http://localhost:5000/api/payments/payfast-ipn',
  };

  const query = new URLSearchParams(params).toString();
  const redirectUrl = `https://payfast.payfast.pk/merchant/gateway?${query}`;

  res.redirect(redirectUrl);
});

module.exports = {
  handleGooglePay,
  createStripeIntent,
  handlePayFastRedirect,
};
