const Auction = require('../models/Auction');
const User = require('../models/User');
const sendEmail = require('./sendEmail');

const sendAuctionReminders = async () => {
  const now = new Date();

  try {
    const allBidders = await User.find({ role: 'bidder' }, 'email name');
    if (!allBidders.length) return;

    const in24hStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const in24hEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const auctions24h = await Auction.find({
      status: { $in: ['live', 'upcoming'] },
      endTime: { $gte: in24hStart, $lte: in24hEnd },
      notified24h: false,
    });

    for (const auction of auctions24h) {
      for (const bidder of allBidders) {
        await sendEmail(
          bidder.email,
          `⏰ Auction ending in 24 hours: ${auction.title}`,
          `Hi ${bidder.name},\n\nThe auction "${auction.title}" is ending in 24 hours!\n\nCurrent Bid: Rs. ${auction.currentBid || auction.startingBid}\nEnds At: ${new Date(auction.endTime).toLocaleString()}\n\nDon't miss your chance to bid!\n\n— Auction System`
        );
      }
      auction.notified24h = true;
      await auction.save();
    }

    const in15mStart = new Date(now.getTime() + 14 * 60 * 1000);
    const in15mEnd = new Date(now.getTime() + 16 * 60 * 1000);

    const auctions15m = await Auction.find({
      status: { $in: ['live', 'upcoming'] },
      endTime: { $gte: in15mStart, $lte: in15mEnd },
      notified15m: false,
    });

    for (const auction of auctions15m) {
      for (const bidder of allBidders) {
        await sendEmail(
          bidder.email,
          `🚨 Last Call! Auction ending in 15 minutes: ${auction.title}`,
          `Hi ${bidder.name},\n\nHurry! The auction "${auction.title}" is ending in just 15 minutes!\n\nCurrent Bid: Rs. ${auction.currentBid || auction.startingBid}\nEnds At: ${new Date(auction.endTime).toLocaleString()}\n\nPlace your bid now before it's too late!\n\n— Auction System`
        );
      }
      auction.notified15m = true;
      await auction.save();
    }

  } catch (err) {
    console.error('Error sending auction reminders:', err.message);
  }
};

module.exports = sendAuctionReminders;
