import "dotenv/config";
import express from "express";
import cors from "cors"; 
import initDatabase from "./src/config/defaultUser.js";
import indexRouter from "./src/routes/index.js";

const app = express();

const corsOptions = {
  origin: [
    "https://todo-frontend-xpz1-7b2u7z344-santhoshs-projects-0bd19b5e.vercel.app", 
    "https://todo-frontend-xpz1.vercel.app",
    "http://localhost:3000", 
    process.env.FRONTEND_URL 
  ].filter(Boolean), 
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  exposedHeaders: ["Content-Range", "X-Content-Range"]
};

// Only use this - it handles both regular requests and OPTIONS preflight
app.use(cors(corsOptions));

app.use(express.json());

app.use("/api", indexRouter);

const PORT = process.env.PORT || 10000;

console.log('CORS allowed origins:', corsOptions.origin);

(async () => {
  try {
    console.log("🔧 Initializing database schema...");
    await initDatabase();
    console.log("✅ Database ready");
  } catch (err) {
    console.error("⚠️ DB init failed, continuing without crash:", err.message);
  }
})();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 CORS enabled for: ${corsOptions.origin.join(', ')}`);
});

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

// 404 handler (optional)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});