import express from 'express';
import Request from '../models/Request.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/mechanic/requests - Mechanic's assigned + pending requests
router.get('/requests', protect, authorize('mechanic'), async (req, res) => {
  try {
    const requests = await Request.find({
      $or: [{ status: 'pending' }, { mechanic: req.user._id }]
    })
      .populate('client', 'name email phone')
      .populate('mechanic', 'name email phone specialization')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/mechanic/requests/:id/accept
router.patch('/requests/:id/accept', protect, authorize('mechanic'), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request is no longer pending' });

    const { estimatedCost, mechanicNote } = req.body;
    if (!estimatedCost || estimatedCost <= 0) {
      return res.status(400).json({ message: 'Please provide a valid estimated cost' });
    }

    request.status = 'accepted';
    request.mechanic = req.user._id;
    request.estimatedCost = estimatedCost;
    request.mechanicNote = mechanicNote || '';
    await request.save();

    const populated = await request.populate([
      { path: 'client', select: 'name email phone' },
      { path: 'mechanic', select: 'name email phone specialization rating' }
    ]);

    res.json({ request: populated, message: 'Request accepted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/mechanic/requests/:id/reject
router.patch('/requests/:id/reject', protect, authorize('mechanic'), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request is no longer pending' });

    request.status = 'rejected';
    request.mechanicNote = req.body.reason || 'Rejected by mechanic';
    await request.save();

    res.json({ request, message: 'Request rejected' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/mechanic/requests/:id/complete
router.patch('/requests/:id/complete', protect, authorize('mechanic'), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.mechanic?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (request.status !== 'accepted' && request.status !== 'in_progress') {
      return res.status(400).json({ message: 'Request must be accepted first' });
    }

    request.status = 'completed';
    request.finalCost = req.body.finalCost || request.estimatedCost;
    await request.save();

    res.json({ request, message: 'Request marked as completed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/mechanic/availability
router.patch('/availability', protect, authorize('mechanic'), async (req, res) => {
  try {
    req.user.isAvailable = req.body.isAvailable;
    await req.user.save();
    res.json({ message: 'Availability updated', isAvailable: req.user.isAvailable });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
