import mongoose from 'mongoose';

const healthSchema = new mongoose.Schema({
  type: { type: String, enum: ['sleep', 'lab', 'weight'], required: true },
  value: { type: Number },
  unit: { type: String, default: '' },
  notes: { type: String, default: '' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Health', healthSchema);

