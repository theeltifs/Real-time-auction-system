const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, required: true },
  time: { type: Date, default: Date.now }
});

const auctionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: String,
  image: String,     // Will hold image filename or URL.
  startingBid: { type: Number, required: true },
  currentBid: { type: Number, default: 0 },
  bids: [bidSchema],
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  endTime: Date,
  status: {
    type: String,
    enum: ['live', 'upcoming', 'ended'],
    default: 'upcoming'
  },
  notified24h: { type: Boolean, default: false },
  notified15m: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Auction', auctionSchema);
