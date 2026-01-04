import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import taskRoutes from "./routes/tasks.js";
import habitRoutes from "./routes/habits.js";
import missionRoutes from "./routes/missions.js";
import userRoutes from "./routes/user.js";
import moodRoutes from "./routes/mood.js";
import healthRoutes from "./routes/health.js";
import financeRoutes from "./routes/finance.js";
import mediaRoutes from "./routes/media.js";
import characterRoutes from "./routes/characters.js";
import settingsRoutes from "./routes/settings.js";
import wishlistRoutes from "./routes/wishlist.js";
import dungeonRoutes from "./routes/dungeons.js";
import weaponRoutes from "./routes/weapons.js";
import buildingRoutes from "./routes/buildings.js";
import marketRoutes from "./routes/market.js";
import gachaRoutes from "./routes/gacha.js";
import albumRoutes from "./routes/album.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

// Middleware
if (isProduction) {
  // In production, serve static files from frontend/dist
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
} else {
  // In development, enable CORS
  app.use(cors());
}
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/liferpg", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/tasks", taskRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/missions", missionRoutes);
app.use("/api/user", userRoutes);
app.use("/api/mood", moodRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/characters", characterRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/dungeons", dungeonRoutes);
app.use("/api/weapons", weaponRoutes);
app.use("/api/buildings", buildingRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/gacha", gachaRoutes);
app.use("/api/album", albumRoutes);

// Serve frontend in production
if (isProduction) {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (isProduction) {
    console.log("Production mode: Serving frontend static files");
  }
});
