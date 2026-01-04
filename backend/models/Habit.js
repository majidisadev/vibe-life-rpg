import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['positive', 'negative', 'both'], required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  tags: [{ type: String }],
  resetCounter: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
  streak: { type: Number, default: 0 },
  currentCount: { type: Number, default: 0 },
  lastReset: { type: Date, default: Date.now },
  order: { type: Number, default: 0 },
  entries: [{
    date: { type: Date, default: Date.now },
    value: { type: Number, default: 0 } // +1 for positive, -1 for negative
  }]
}, { timestamps: true });

export default mongoose.model('Habit', habitSchema);

