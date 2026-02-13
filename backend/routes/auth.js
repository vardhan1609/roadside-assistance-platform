import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone, role, specialization, vehicleType, licenseNumber } = req.body;

    if (!['client', 'mechanic'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Only client or mechanic allowed' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    const userData = { name, email, password, phone, role };
    if (role === 'mechanic') {
      userData.specialization = specialization;
      userData.vehicleType = vehicleType;
      userData.licenseNumber = licenseNumber;
    }

    const user = await User.create(userData);
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id, name: user.name, email: user.email,
        phone: user.phone, role: user.role, isBlocked: user.isBlocked,
        specialization: user.specialization, isAvailable: user.isAvailable
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.isBlocked) return res.status(403).json({ message: 'Your account has been blocked by admin' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        _id: user._id, name: user.name, email: user.email,
        phone: user.phone, role: user.role, isBlocked: user.isBlocked,
        specialization: user.specialization, isAvailable: user.isAvailable,
        rating: user.rating, location: user.location
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/create-admin (one-time admin creation)
router.post('/create-admin', async (req, res) => {
  try {
    const { name, email, password, phone, secretKey } = req.body;
    if (secretKey !== 'ROADSIDE_ADMIN_2024') {
      return res.status(403).json({ message: 'Invalid secret key' });
    }
    const existing = await User.findOne({ role: 'admin' });
    if (existing) return res.status(400).json({ message: 'Admin already exists' });

    const admin = await User.create({ name, email, password, phone, role: 'admin' });
    const token = generateToken(admin._id);
    res.status(201).json({ token, user: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
