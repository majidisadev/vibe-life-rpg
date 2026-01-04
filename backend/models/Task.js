import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    checklist: [
      {
        text: { type: String, required: true },
        checked: { type: Boolean, default: false },
      },
    ],
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    startDate: { type: Date, default: Date.now },
    repeatType: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "daily",
    },
    repeatEvery: { type: Number, default: 1 }, // For weekly/monthly
    repeatOn: [{ type: Number }], // Days of week (0-6) or dates (1-31)
    tags: [{ type: String }],
    completed: { type: Boolean, default: false },
    completedDate: { type: Date },
    skipped: { type: Boolean, default: false },
    skippedDate: { type: Date },
    lastReset: { type: Date, default: Date.now },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
