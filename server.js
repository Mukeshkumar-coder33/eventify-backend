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

// Middleware to log requests (helpful for debugging other devices)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('origin')}`);
    next();
});

const allowedOrigins = [
    'https://eventify-frontend-eight.vercel.app',
    'http://localhost:5173',
    'http://localhost:5000'
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // During development/debugging, you might want to allow more origins
        // Check if it's one of the allowed ones OR a local network IP
        const isAllowed = allowedOrigins.indexOf(origin) !== -1 ||
            origin.startsWith('http://192.168.') ||
            origin.startsWith('http://172.') ||
            origin.startsWith('http://10.');

        if (isAllowed) {
            return callback(null, true);
        } else {
            console.warn(`Blocked CORS request from origin: ${origin}`);
            return callback(new Error('Not allowed by CORS'), false);
        }
    },
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
