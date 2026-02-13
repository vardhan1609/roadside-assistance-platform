import express from 'express';
import User from '../models/User.js';
import Request from '../models/Request.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/admin/users
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : { role: { $ne: 'admin' } };
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/users/:id/block
router.patch('/users/:id/block', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot block admin' });

    user.isBlocked = true;
    await user.save();
    res.json({ message: `${user.name} has been blocked`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/users/:id/unblock
router.patch('/users/:id/unblock', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isBlocked = false;
    await user.save();
    res.json({ message: `${user.name} has been unblocked`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/requests
router.get('/requests', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const requests = await Request.find(query)
      .populate('client', 'name email phone')
      .populate('mechanic', 'name email phone specialization')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/stats
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const [totalClients, totalMechanics, totalRequests, pendingRequests, completedRequests, blockedUsers] = await Promise.all([
      User.countDocuments({ role: 'client' }),
      User.countDocuments({ role: 'mechanic' }),
      Request.countDocuments(),
      Request.countDocuments({ status: 'pending' }),
      Request.countDocuments({ status: 'completed' }),
      User.countDocuments({ isBlocked: true })
    ]);

    res.json({ totalClients, totalMechanics, totalRequests, pendingRequests, completedRequests, blockedUsers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
