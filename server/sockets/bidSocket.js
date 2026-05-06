const Auction    = require('../models/Auction');
const User       = require('../models/User');
const FlaggedBid = require('../models/FlaggedBid');
const { analyzeBidAnomaly } = require('../utils/anomalyAnalyzer');

/**
 * Resolves a bidder's ObjectId string from a bids-array entry,
 * handling both populated (User document) and raw ObjectId states.
 */
function resolveBidderId(bidderField) {
  return (bidderField?._id ?? bidderField)?.toString();
}

/**
 * Runs after the bid is saved and broadcast. Fetches bidder email,
 * calls Ollama, and persists the FlaggedBid document.
 * Must never throw — caller uses .catch() for logging only.
 */
async function runAnomalyAnalysis({
  auction,
  auctionId,
  userId,
  amount,
  previousBid,
  originalEndTime,
  bidTimestamp,
  triggeredRules,
  recentBidCount,
}) {
  const bidder = await User.findById(userId).select('email').lean();

  const bidContext = {
    auctionId:                              auctionId.toString(),
    auctionTitle:                           auction.title,
    auctionStartingBid:                     auction.startingBid,
    auctionCurrentBidBeforeThisBid:         previousBid,
    auctionEndTime:                         originalEndTime.toISOString(),
    bidderId:                               userId.toString(),
    bidderEmail:                            bidder?.email ?? 'unknown',
    newBidAmount:                           amount,
    bidTimestamp:                           bidTimestamp.toISOString(),
    recentBidCountByThisUserInLast2Minutes: recentBidCount,
    totalBidsInThisAuctionSoFar:            auction.bids.length,
  };

  const { verdict, reason, raw } = await analyzeBidAnomaly(bidContext, triggeredRules);

  await FlaggedBid.create({
    auctionId,
    auctionTitle:   auction.title,
    bidderId:       userId,
    bidderEmail:    bidder?.email ?? 'unknown',
    bidAmount:      amount,
    bidTimestamp,
    triggeredRules,
    llmVerdict:     verdict,
    llmReason:      reason,
    rawLlmResponse: raw,
  });

  console.log(`[AnomalyDetection] Bid flagged | auction=${auction.title} | verdict=${verdict} | rules=${triggeredRules.map(r => r.rule).join(',')}`);
}

module.exports = (io) => {
  const roomUsers = {};
  const roomRoles = {};

  io.on('connection', (socket) => {
    console.log('Connected:', socket.id);

    socket.on('joinAuction', (auctionId) => {
      socket.join(auctionId);

      if (!roomUsers[auctionId]) roomUsers[auctionId] = new Set();
      if (!roomRoles[auctionId]) roomRoles[auctionId] = { seller: new Set(), bidder: new Set(), admin: new Set() };

      socket.on('identifyUser', ({ userId, role }) => {
        if (userId && role) {
          roomUsers[auctionId].add(userId);
          if (roomRoles[auctionId][role]) roomRoles[auctionId][role].add(userId);

          io.to(auctionId).emit('uniqueBidders', roomUsers[auctionId].size);
          io.to(auctionId).emit('viewersByRole', {
            sellers: roomRoles[auctionId].seller.size,
            bidders: roomRoles[auctionId].bidder.size,
          });
        }
      });

      const userCount = io.sockets.adapter.rooms.get(auctionId)?.size || 0;
      io.to(auctionId).emit('userCount', userCount);
    });

    socket.on('placeBid', async ({ auctionId, userId, amount }) => {
      try {
        const auction = await Auction.findById(auctionId).populate('bids.bidder', 'name');

        if (!auction || auction.status !== 'live') {
          return socket.emit('bidError', 'Auction is not live.');
        }

        if (auction.seller.toString() === userId) {
          return socket.emit('bidError', 'Sellers cannot bid on their own auction.');
        }

        if (amount <= auction.currentBid) {
          return socket.emit('bidError', 'Bid must be higher.');
        }

        // Capture pre-mutation state — rule engine depends on these values
        const previousBid     = auction.currentBid;
        const originalEndTime = new Date(auction.endTime);
        const priorBidsCount  = auction.bids.length;
        const bidTimestamp    = new Date();

        auction.currentBid = amount;
        auction.bids.push({ bidder: userId, amount, time: bidTimestamp });
        auction.endTime = new Date(bidTimestamp.getTime() + 30 * 1000);
        await auction.save();

        const userName = auction.bids[auction.bids.length - 1].bidder?.name || 'Bidder';

        // Broadcast immediately — anomaly detection never blocks this
        io.to(auctionId).emit('newBid', {
          auctionId,
          amount,
          bidder: userId,
          bidderName: userName,
          time: bidTimestamp,
          newEndTime: auction.endTime,
        });

        roomUsers[auctionId]?.add(userId);
        io.to(auctionId).emit('uniqueBidders', roomUsers[auctionId].size);

        // ── Rule Engine ────────────────────────────────────────────────
        const triggeredRules = [];

        // Rule 1: Rapid Consecutive Bidding — 3+ bids by same user within 2 minutes
        const cutoff = new Date(bidTimestamp.getTime() - 120_000);
        const recentBidCount = auction.bids.filter(b => {
          return resolveBidderId(b.bidder) === userId.toString() && b.time >= cutoff;
        }).length;

        if (recentBidCount >= 3) {
          triggeredRules.push({ rule: 'RAPID_BIDDING', detail: 'Placed 3 or more bids within 2 minutes' });
        }

        // Rule 2: Abnormal Bid Jump — skip on first bid (previousBid is 0, ratio is meaningless)
        if (priorBidsCount > 0 && amount >= previousBid * 5) {
          triggeredRules.push({ rule: 'ABNORMAL_JUMP', detail: 'Bid amount is 5x or more than previous bid' });
        }

        // Rule 3: Last-Second Sniping — evaluated against pre-extend endTime
        if ((originalEndTime.getTime() - bidTimestamp.getTime()) <= 10_000) {
          triggeredRules.push({ rule: 'SNIPE_BID', detail: 'Bid placed within 10 seconds of auction end time' });
        }
        // ──────────────────────────────────────────────────────────────

        if (triggeredRules.length > 0) {
          runAnomalyAnalysis({
            auction,
            auctionId,
            userId,
            amount,
            previousBid,
            originalEndTime,
            bidTimestamp,
            triggeredRules,
            recentBidCount,
          }).catch(err => console.error('[AnomalyDetection] Background analysis failed:', err.message));
        }

      } catch (err) {
        console.error('Bid error:', err.message);
        socket.emit('bidError', 'Server error during bid.');
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected:', socket.id);
    });
  });
};
