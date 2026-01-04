import mongoose from 'mongoose';

const financeSchema = new mongoose.Schema({
  type: { type: String, enum: ['income', 'outcome'], required: true },
  amount: { type: Number, required: true },
  category: { type: String, default: '' },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Finance', financeSchema);

