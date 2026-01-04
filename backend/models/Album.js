import mongoose from "mongoose";

const albumSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" }, // photo title
    image: { type: String, required: true }, // base64 string from upload
    tags: [{ type: String }], // custom tags
    characters: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Character" },
    ], // multiple characters, hanya dari activeCharacters
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
    }, // hanya lewd_location yang sudah built, optional
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Album", albumSchema);

