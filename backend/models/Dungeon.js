import mongoose from "mongoose";

const dungeonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" }, // base64 string from upload
    minLevel: { type: Number, default: 0 }, // Minimum level to unlock dungeon
    stages: [
      {
        stageNumber: { type: Number, required: true },
        enemy: { type: mongoose.Schema.Types.ObjectId, ref: "Character" }, // characterType: 'enemy'
        unlocked: { type: Boolean, default: false },
      },
    ],
    unlocked: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Dungeon", dungeonSchema);

