import { Pool } from "pg"

console.log('Connecting to database:', process.env.DATABASE_URL ? 
  process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@') : 
  'DATABASE_URL not set');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected successfully");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL connection error:", err.message);
});

export default pool;