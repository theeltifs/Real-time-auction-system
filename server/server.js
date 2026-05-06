require('dotenv').config();

const dotenv = require('dotenv');
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');

const cors = require('cors');
const { Server } = require('socket.io');
const endExpiredAuctions = require('./utils/endExpiredAuctions');
const sendAuctionReminders = require('./utils/sendAuctionReminders');
const paymentRoutes = require('./routes/paymentRoutes');
const authRoutes = require('./routes/authRoutes');
dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Later replace with frontend URL.
    methods: ["GET", "POST"],
    credentials: true
  }
});


app.use(cors());
app.use(express.json());



// all the Routes.
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/auctions', require('./routes/auctionRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/uploads', express.static('uploads'));
app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);

// WebSockets.
require('./sockets/bidSocket')(io);

// Add this default GET route.
app.get('/', (req, res) => {
  res.send('✅ Real-Time Auction API is running...');
});

setInterval(endExpiredAuctions, 10000);
setInterval(sendAuctionReminders, 60000); // Check every 1 minute.

mongoose.connect(process.env.MONGO_URI)
  .then(() => server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  }))
  .catch(err => console.error(err));
