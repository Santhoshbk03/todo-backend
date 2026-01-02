// 🔹 Load dotenv ONLY in local development
if (process.env.NODE_ENV !== "production") {
  await import("dotenv/config");
}

import express from "express";
import initDatabase from "./src/config/defaultUser.js";
import indexRouter from "./src/routes/index.js";

const app = express();
app.use(express.json());

// Routes
app.use("/api", indexRouter);

const PORT = process.env.PORT || 10000;

// 🔹 Initialize DB safely (no crash on failure)
(async () => {
  try {
    console.log("🔧 Initializing database schema...");
    await initDatabase();
    console.log("✅ Database ready");
  } catch (err) {
    console.error("⚠️ DB init failed, continuing without crash:", err.message);
  }
})();

// 🔹 Start server (Render requires process to stay alive)
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
