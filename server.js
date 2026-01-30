const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.MONGO_URI) {
    console.error('CRITICAL ERROR: MONGO_URI is not defined in environment variables!');
} else {
    const dbName = process.env.MONGO_URI.split('/').pop().split('?')[0];
    console.log(`MONGO_URI is defined. Attempting to connect to database: ${dbName}`);
}

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
        // allow non-browser requests
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        console.warn(`Blocked CORS request from origin: ${origin}`);
        return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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

app.get('/health', (req, res) => {
    const status = mongoose.connection.readyState;
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    res.json({
        status: states[status] || 'unknown',
        mongoConnected: status === 1,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('--- UNHANDLED ERROR ---');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.error('-----------------------');

    res.status(err.status || 500).json({
        message: 'Internal Server Error',
        error: err.message,
        path: req.path
    });
});
