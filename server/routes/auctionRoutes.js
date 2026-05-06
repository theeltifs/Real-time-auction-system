const express = require('express');
const router = express.Router();
const multer = require('multer');
const asyncHandler = require('express-async-handler');

const {
  createAuction,
  getAuctions,
  getSellerAuctions,
  getAuctionById,
} = require('../controllers/auctionController');

const { protect, adminOnly } = require('../middleware/authMiddleware');
const Auction = require('../models/Auction');

//  image upload Setup.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

//  Create auction
router.post('/', protect, upload.single('image'), createAuction);

//  Use the correct getAuctions controller that supports filters + pagination.
router.get('/', asyncHandler(getAuctions));

//  Seller's own auctions.
router.get('/seller/my-auctions', protect, asyncHandler(getSellerAuctions));

//  Get a single auction by ID (needed by BidRoom)
router.get('/:id', asyncHandler(getAuctionById));


//  delete auction.
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id);
  if (!auction) return res.status(404).json({ message: 'Auction not found' });

  if (req.user.role !== 'admin' && auction.seller.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized to delete this auction' });
  }

  await auction.deleteOne();
  res.json({ message: 'Auction deleted successfully' });
}));

//  Update auction.
router.put('/:id', protect, asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id);
  if (!auction) return res.status(404).json({ message: 'Auction not found' });

  if (req.user.role !== 'admin' && auction.seller.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized to update this auction' });
  }

  if (auction.status === 'ended') {
    return res.status(400).json({ message: 'Cannot edit ended auction' });
  }

  const { title, category, startingBid, endTime, description } = req.body;

  if (title) auction.title = title;
  if (category) auction.category = category;
  if (endTime) auction.endTime = endTime;
  if (description) auction.description = description;

  if (startingBid) {
    auction.startingBid = startingBid;
    if (auction.bids.length === 0) {
      auction.currentBid = startingBid;
    }
  }

  await auction.save();
  res.json({ message: 'Auction updated successfully', auction });
}));

//  Admin--> end auction.
router.put('/:id/end', protect, adminOnly, asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id);
  if (!auction) return res.status(404).json({ message: 'Auction not found' });

  auction.status = 'ended';
  await auction.save();

  res.json({ message: 'Auction ended' });
}));

module.exports = router;
