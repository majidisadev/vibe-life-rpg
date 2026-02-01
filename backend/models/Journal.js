import mongoose from "mongoose";

const journalSchema = new mongoose.Schema(
  {
    content: { type: String, default: "" },
    images: [{ type: String }],
    locationTag: {
      locType: { type: String, enum: ["dungeon", "house", "leisure"], default: null },
      refId: { type: mongoose.Schema.Types.ObjectId, default: null },
    },
    characterTags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
    hashtags: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model("Journal", journalSchema);
