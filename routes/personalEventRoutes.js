const express = require('express');
const router = express.Router();
const PersonalEvent = require('../models/PersonalEvent');
const { protect } = require('../middleware/authMiddleware');

// Get all events
router.get('/', async (req, res) => {
    try {
        const events = await PersonalEvent.find().populate('user', 'name').sort({ createdAt: -1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create event
router.post('/', protect, async (req, res) => {
    const { name, location, time, description } = req.body;
    try {
        const event = new PersonalEvent({
            user: req.user,
            name,
            location,
            time,
            description,
            rsvpUsers: []
        });
        const createdEvent = await event.save();
        res.status(201).json(createdEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update event
router.put('/:id', protect, async (req, res) => {
    try {
        const event = await PersonalEvent.findById(req.params.id);
        if (event) {
            if (event.user.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }
            event.name = req.body.name || event.name;
            event.location = req.body.location || event.location;
            event.time = req.body.time || event.time;
            event.description = req.body.description || event.description;
            const updatedEvent = await event.save();
            res.json(updatedEvent);
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete event
router.delete('/:id', protect, async (req, res) => {
    try {
        const event = await PersonalEvent.findById(req.params.id);
        if (event) {
            if (event.user.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }
            await event.deleteOne();
            res.json({ message: 'Event removed' });
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// RSVP Toggle
router.post('/:id/rsvp', protect, async (req, res) => {
    try {
        const event = await PersonalEvent.findById(req.params.id);
        if (event) {
            const userId = req.user._id.toString();
            const alreadyRsvp = event.rsvpUsers.some(id => id.toString() === userId);
            if (alreadyRsvp) {
                event.rsvpUsers = event.rsvpUsers.filter(id => id.toString() !== userId);
            } else {
                event.rsvpUsers.push(req.user._id);
            }
            await event.save();
            res.json(event);
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
