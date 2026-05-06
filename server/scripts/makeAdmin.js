require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function makeAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOneAndUpdate(
    { email: 'justabd223@gmail.com' },
    { role: 'admin' },
    { new: true }
  );
  if (!user) {
    console.log('User not found');
  } else {
    console.log(`Done: ${user.name} (${user.email}) is now role=${user.role}`);
  }
  await mongoose.disconnect();
}

makeAdmin().catch(console.error);
