import "dotenv/config";
import express from "express";
import cors from "cors"; // Import cors
import initDatabase from "./src/config/defaultUser.js";
import indexRouter from "./src/routes/index.js";

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    "https://todo-frontend-xpz1.vercel.app", // Your Vercel frontend
    "http://localhost:3000", // Local development
    process.env.FRONTEND_URL // Optional: from environment variable
  ].filter(Boolean), // Remove any falsy values
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  exposedHeaders: ["Content-Range", "X-Content-Range"]
};

// Use CORS middleware
app.use(cors(corsOptions));

// Preflight requests
app.options("*", cors(corsOptions));

app.use(express.json());

// Routes
app.use("/api", indexRouter);

const PORT = process.env.PORT || 10000;

// Log CORS settings
console.log('CORS allowed origins:', corsOptions.origin);

// 🔹 Initialize DB with better error handling
(async () => {
  try {
    console.log("🔧 Initializing database schema...");
    await initDatabase();
    console.log("✅ Database ready");
  } catch (err) {
    console.error("⚠️ DB init failed, continuing without crash:", err.message);
  }
})();

// 🔹 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 CORS enabled for: ${corsOptions.origin.join(', ')}`);
});

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    cors: {
      enabled: true,
      allowedOrigins: corsOptions.origin
    }
  });
});