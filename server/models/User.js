const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    // only required if not using Google login.
    required: function () {
      return !this.googleId;
    }
  },

  googleId: {
    type: String,
    default: null
  },

  role: {
    type: String,
    enum: ['seller', 'bidder', 'admin'],
    default: 'bidder'
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  ratings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rating'
  }]
}, { timestamps: true });

// will Hash password if it's modified and exists.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed one.
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
