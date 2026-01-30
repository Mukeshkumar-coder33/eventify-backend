const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    concertEvent: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'ConcertEvent'
    },
    ticketCategory: { type: String, required: true },
    amount: { type: Number, required: true },
    razorpayPaymentId: { type: String },
    razorpayOrderId: { type: String },
    name: { type: String, required: true },
    address: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
