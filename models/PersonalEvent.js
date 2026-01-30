const mongoose = require('mongoose');

const personalEventSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: { type: String, required: true },
    location: { type: String, required: true },
    time: { type: String, required: true },
    description: { type: String, required: true },
    rsvpUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

module.exports = mongoose.model('PersonalEvent', personalEventSchema);
