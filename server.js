const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET is not defined in environment variables');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Update CORS to allow your Vercel frontend
app.use(cors({
    origin: ['https://eventify-frontend-eight.vercel.app'],
    credentials: true
}));
app.use(express.json());

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        // Don't exit process if you want the server to keep trying or handle it gracefully
    }
};

connectDB();

mongoose.connection.on('error', err => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('Mongoose disconnected');
});

mongoose.connection.on('reconnected', () => {
    console.log('Mongoose reconnected');
});

const authRoutes = require('./routes/authRoutes');
const personalEventRoutes = require('./routes/personalEventRoutes');
const concertRoutes = require('./routes/concertRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/personal-events', personalEventRoutes);
app.use('/api/concert-events', concertRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/', (req, res) => {
    res.send('Eventify API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});
