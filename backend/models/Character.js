import mongoose from "mongoose";

const characterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    media: { type: mongoose.Schema.Types.ObjectId, ref: "Media" },
    characterType: {
      type: String,
      enum: ["enemy", "supporting_character"],
      default: null,
    },
    cover: { type: String, default: "" },
    countryOrigin: { type: String, default: "" },
    japanPrefecture: { type: String, default: "" }, // Only used if countryOrigin is Japan
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String },
    },
    unlocked: { type: Boolean, default: false },
    enemyStats: {
      hp: { type: Number, default: 10 },
      baseReward: {
        xp: { type: Number, default: 5 },
        coins: { type: Number, default: 5 },
        resources: {
          meat: { type: Number, default: 0 },
          wood: { type: Number, default: 0 },
          stone: { type: Number, default: 0 },
          iron: { type: Number, default: 0 },
          crystal: { type: Number, default: 0 },
        },
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Character", characterSchema);
