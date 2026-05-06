const Auction = require('../models/Auction');
const sendEmail = require('./sendEmail');

const endExpiredAuctions = async () => {
  const now = new Date();
  try {
    const auctions = await Auction.find({
      endTime: { $lte: now },
      status: 'live',
    }).populate('bids.bidder');

    for (const auction of auctions) {
      auction.status = 'ended';
      await auction.save();

      const lastBid = auction.bids[auction.bids.length - 1];
      const winner = lastBid?.bidder;

      if (winner?.email) {
        await sendEmail(
          winner.email,
          `You won the auction: ${auction.title}`,
          `Congratulations ${winner.name},\n\nYou won the auction for "${auction.title}" with a bid of Rs. ${lastBid.amount}.\n\nThank you for participating!\n\n— Auction System`
        );
      }

      console.log(`Auction "${auction.title}" ended. Winner: ${winner?.name || 'No bids'}`);
    }
  } catch (err) {
    console.error('Error ending auctions:', err.message);
  }
};

module.exports = endExpiredAuctions;
