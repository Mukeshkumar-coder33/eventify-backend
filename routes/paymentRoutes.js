const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const ConcertEvent = require('../models/ConcertEvent');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { protect } = require('../middleware/authMiddleware');
const nodemailer = require('nodemailer');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Order
router.post('/order', protect, async (req, res) => {
    const { amount } = req.body;
    try {
        const options = {
            amount: amount * 100, // amount in smallest currency unit
            currency: "INR",
            receipt: "receipt_" + Math.random().toString(36).substring(7),
        };
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Verify Payment and Save
router.post('/verify', protect, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentData } = req.body;

    try {
        // Verify Signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            return res.status(400).json({ message: "Invalid signature sent!" });
        }

        // Save Payment
        const { concertEventId, ticketCategory, amount, customerDetails } = paymentData;
        const payment = new Payment({
            user: req.user._id,
            concertEvent: concertEventId,
            ticketCategory,
            amount,
            name: customerDetails.name,
            address: customerDetails.address,
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id
        });
        const createdPayment = await payment.save();

        // Send Emails (logic copied from previous implementation)
        sendReceiptEmail(createdPayment, customerDetails);

        res.status(201).json({ message: "Payment verified successfully", payment: createdPayment });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

async function sendReceiptEmail(paymentId, customerDetails) {
    const populatedPayment = await Payment.findById(paymentId)
        .populate('user', 'name email')
        .populate({
            path: 'concertEvent',
            populate: { path: 'user', select: 'name email' }
        });

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        // Email to buyer
        if (populatedPayment.user?.email) {
            const receiptEmail = {
                from: process.env.EMAIL_USER,
                to: populatedPayment.user.email,
                subject: '🎫 Payment Receipt - Eventify',
                html: `
                        <h2>Payment Successful via Razorpay!</h2>
                        <p>Thank you just booked a ticket for <strong>${populatedPayment.concertEvent.name}</strong>.</p>
                        <p>Ticket: ${populatedPayment.ticketCategory.toUpperCase()}</p>
                        <p>Amount: ₹${populatedPayment.amount}</p>
                        <p>Transaction ID: ${populatedPayment.razorpayPaymentId}</p>
                    `
            };
            try { await transporter.sendMail(receiptEmail); } catch (e) { console.error(e); }
        }
    } else {
        console.log("Mock Email Sent to", populatedPayment.user?.email);
    }
}

module.exports = router;
