import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mechanic: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  title: { type: String, required: true },
  description: { type: String, required: true },
  serviceType: {
    type: String,
    enum: ['flat_tire', 'battery_jump', 'fuel_delivery', 'towing', 'lockout', 'engine_trouble', 'accident', 'other'],
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['car', 'motorcycle', 'truck', 'van', 'bus', 'other'],
    required: true
  },
  vehicleModel: { type: String },
  vehiclePlate: { type: String },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  estimatedCost: { type: Number, default: null },
  finalCost: { type: Number, default: null },
  mechanicNote: { type: String },
  clientNote: { type: String },
  images: [{ type: String }],
  cancelledBy: { type: String, enum: ['client', 'mechanic', 'admin', null], default: null },
  cancelReason: { type: String }
}, { timestamps: true });

export default mongoose.model('Request', requestSchema);
