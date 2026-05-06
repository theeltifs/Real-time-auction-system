const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// generates a signed JWT valid for 7 days
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/google
exports.googleAuth = async (req, res) => {
  const { tokenId, role } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, sub: googleId } = ticket.getPayload();

    if (!email || !googleId) {
      return res.status(400).json({ message: 'Invalid Google account' });
    }

    let user = await User.findOne({ email });

    // create account on first Google login, using the role selected on frontend
    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        isVerified: true,
        role: role || 'bidder',
      });
    }

    const token = generateToken(user);
    res.status(200).json({ user, token });
  } catch (err) {
    console.error('Google Login Error:', err);
    res.status(401).json({ message: 'Google login failed' });
  }
};
