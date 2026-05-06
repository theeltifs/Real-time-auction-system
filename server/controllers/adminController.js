const User       = require('../models/User');
const FlaggedBid = require('../models/FlaggedBid');
const bcrypt     = require('bcryptjs');

// GET /api/users — admin only
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/users — admin only
exports.addUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });

    res.status(201).json({ message: 'User created successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/users/:id — admin only
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/admin/bootstrap — no auth, secret-key protected, for creating the first admin
exports.bootstrapAdmin = async (req, res) => {
  const { email, secret } = req.body;

  if (!secret || secret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
    return res.status(403).json({ message: 'Invalid bootstrap secret' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.role = 'admin';
    await user.save();

    res.json({ message: `${user.name} is now an admin`, email: user.email });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/flagged-bids — admin only
exports.getFlaggedBids = async (req, res) => {
  try {
    const { verdict } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);

    const filter = {};
    if (verdict === 'SUSPICIOUS' || verdict === 'NORMAL') filter.llmVerdict = verdict;

    const [flaggedBids, total] = await Promise.all([
      FlaggedBid.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      FlaggedBid.countDocuments(filter),
    ]);

    res.json({ total, page, limit, flaggedBids });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/admin/set-role — admin only
exports.setUserRole = async (req, res) => {
  const { email, role } = req.body;

  if (!['admin', 'seller', 'bidder'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Must be admin, seller, or bidder' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.role = role;
    await user.save();

    res.json({ message: `${user.name}'s role updated to ${role}`, email: user.email });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
