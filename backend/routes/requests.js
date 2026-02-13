import express from 'express';
import Request from '../models/Request.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/requests - Get all requests (admin sees all, client sees own, mechanic sees pending+own)
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'client') query.client = req.user._id;
    else if (req.user.role === 'mechanic') {
      query = { $or: [{ status: 'pending' }, { mechanic: req.user._id }] };
    }

    const requests = await Request.find(query)
      .populate('client', 'name email phone')
      .populate('mechanic', 'name email phone specialization rating')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/requests/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('client', 'name email phone')
      .populate('mechanic', 'name email phone specialization rating location');

    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Access control
    if (req.user.role === 'client' && request.client._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/requests - Create request (client only)
router.post('/', protect, authorize('client'), async (req, res) => {
  try {
    const { title, description, serviceType, vehicleType, vehicleModel, vehiclePlate, location, clientNote } = req.body;

    const newRequest = await Request.create({
      client: req.user._id,
      title, description, serviceType, vehicleType,
      vehicleModel, vehiclePlate, location, clientNote
    });

    const populated = await newRequest.populate('client', 'name email phone');
    res.status(201).json({ request: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/requests/:id/cancel - Cancel request (client only)
router.patch('/:id/cancel', protect, authorize('client'), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (['completed', 'cancelled'].includes(request.status)) {
      return res.status(400).json({ message: `Cannot cancel a ${request.status} request` });
    }

    request.status = 'cancelled';
    request.cancelledBy = 'client';
    request.cancelReason = req.body.reason || 'Cancelled by client';
    await request.save();

    res.json({ request, message: 'Request cancelled successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
