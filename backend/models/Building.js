import mongoose from "mongoose";

const buildingSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["blacksmith", "house", "market", "lewd_location"],
      required: true,
    },
    name: { type: String, default: "" }, // khusus untuk lewd_location (custom), untuk regular building bisa default
    image: { type: String, default: "" }, // base64 string from upload
    level: { type: Number, default: 1 }, // fixed, tidak ada upgrade
    buildProgress: { type: Number, default: 0 }, // build power accumulated
    buildPowerRequired: { type: Number, default: 0 }, // build power required (25 per pomodoro session)
    resourcesRequired: {
      meat: { type: Number, default: 0 },
      wood: { type: Number, default: 0 },
      stone: { type: Number, default: 0 },
      iron: { type: Number, default: 0 },
      crystal: { type: Number, default: 0 },
    },
    built: { type: Boolean, default: false },
    deletable: { type: Boolean, default: false }, // true hanya untuk lewd_location
    bonusPopulation: { type: Number, default: 5 }, // bonus max population untuk house (default 5 untuk backward compatibility)
  },
  { timestamps: true }
);

export default mongoose.model("Building", buildingSchema);

