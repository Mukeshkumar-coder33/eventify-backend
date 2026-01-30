const mongoose = require('mongoose');

const concertEventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    pricing: {
        gold: { type: Number, required: true },
        platinum: { type: Number, required: true },
        diamond: { type: Number, required: true },
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('ConcertEvent', concertEventSchema);
