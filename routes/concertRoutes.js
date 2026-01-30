const express = require('express');
const router = express.Router();
const ConcertEvent = require('../models/ConcertEvent');
const { protect } = require('../middleware/authMiddleware');

// Get all concerts
router.get('/', async (req, res) => {
    try {
        const concerts = await ConcertEvent.find().populate('user', 'name email').sort({ createdAt: -1 });
        res.json(concerts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create concert (Protected)
router.post('/', protect, async (req, res) => {
    const { name, location, description, pricing } = req.body;
    try {
        const concert = new ConcertEvent({
            name,
            location,
            description,
            pricing,
            user: req.user._id
        });
        const createdConcert = await concert.save();
        const populatedConcert = await ConcertEvent.findById(createdConcert._id).populate('user', 'name email');
        res.status(201).json(populatedConcert);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update concert (Protected - creator only)
router.put('/:id', protect, async (req, res) => {
    const { name, location, description, pricing } = req.body;
    try {
        const concert = await ConcertEvent.findById(req.params.id);

        if (!concert) {
            return res.status(404).json({ message: 'Concert event not found' });
        }

        // Check if user is the creator
        if (concert.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this event' });
        }

        concert.name = name || concert.name;
        concert.location = location || concert.location;
        concert.description = description || concert.description;
        if (pricing) {
            concert.pricing = {
                gold: Number(pricing.gold) || concert.pricing.gold,
                platinum: Number(pricing.platinum) || concert.pricing.platinum,
                diamond: Number(pricing.diamond) || concert.pricing.diamond
            };
        }

        const updatedConcert = await concert.save();
        const populatedConcert = await ConcertEvent.findById(updatedConcert._id).populate('user', 'name email');
        res.json(populatedConcert);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete concert (Protected - creator only)
router.delete('/:id', protect, async (req, res) => {
    try {
        const concert = await ConcertEvent.findById(req.params.id);

        if (!concert) {
            return res.status(404).json({ message: 'Concert event not found' });
        }

        // Check if user is the creator
        if (concert.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this event' });
        }

        await ConcertEvent.deleteOne({ _id: req.params.id });
        res.json({ message: 'Concert event deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
