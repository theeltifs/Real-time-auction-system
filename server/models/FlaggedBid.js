const mongoose = require('mongoose');

const triggeredRuleSchema = new mongoose.Schema(
  { rule: { type: String, required: true }, detail: { type: String, required: true } },
  { _id: false }
);

const flaggedBidSchema = new mongoose.Schema({
  auctionId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
  auctionTitle: { type: String, required: true },
  bidderId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bidderEmail:  { type: String, required: true },
  bidAmount:    { type: Number, required: true },
  bidTimestamp: { type: Date, required: true },
  triggeredRules: { type: [triggeredRuleSchema], required: true },
  llmVerdict:   { type: String, enum: ['SUSPICIOUS', 'NORMAL'], required: true },
  llmReason:    { type: String, required: true },
  rawLlmResponse: { type: String, required: true },
  createdAt:    { type: Date, default: Date.now },
});

module.exports = mongoose.model('FlaggedBid', flaggedBidSchema);
