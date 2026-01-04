import mongoose from 'mongoose';

const missionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  checklist: [{
    text: { type: String, default: '' },
    checked: { type: Boolean, default: false }
  }],
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  dueDate: { type: Date },
  tags: [{ type: String }],
  completed: { type: Boolean, default: false },
  completedDate: { type: Date },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Mission', missionSchema);

