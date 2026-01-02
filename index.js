import express from "express";
import dotenv from "dotenv";
import initDatabase from "./src/config/defaultUser.js";
import indexRouter from "./src/routes/index.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api", indexRouter);

const PORT = process.env.PORT || 10000;

// 🔹 Run DB init SAFELY
(async () => {
  try {
    console.log("🔧 Initializing database schema...");
    await initDatabase();
    console.log("✅ Database ready");
  } catch (err) {
    console.error("⚠️ DB init failed, continuing without crash:", err.message);
  }
})();

// 🔹 Start server WITHOUT await
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
