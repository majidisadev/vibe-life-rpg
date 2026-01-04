import mongoose from "mongoose";

const weaponSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String, default: "" }, // base64 string from upload
    damageBonus: { type: Number, default: 0 }, // bonus damage (base + bonus = total)
    cost: {
      coins: { type: Number, default: 0 },
      resources: {
        meat: { type: Number, default: 0 },
        wood: { type: Number, default: 0 },
        stone: { type: Number, default: 0 },
        iron: { type: Number, default: 0 },
        crystal: { type: Number, default: 0 },
      },
    },
    unlocked: { type: Boolean, default: false }, // via blacksmith building
  },
  { timestamps: true }
);

export default mongoose.model("Weapon", weaponSchema);

