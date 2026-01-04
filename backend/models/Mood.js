import mongoose from 'mongoose';

const moodSchema = new mongoose.Schema({
  rating: { type: Number, min: 1, max: 5, required: true },
  notes: { type: String, default: '' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Mood', moodSchema);

