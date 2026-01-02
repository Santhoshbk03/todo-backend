import bcrypt from "bcrypt";
import pool from "./connect.js";

async function initDatabase() {
  try {
    console.log("🔧 Initializing database schema...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_by INT REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);


    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        group_id INT REFERENCES groups(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_streaks (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        streak_date DATE NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        UNIQUE (user_id, streak_date)
      )
    `);


    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ All tables ensured");


    const { rows } = await pool.query(
      "SELECT COUNT(*) FROM users"
    );

    if (Number(rows[0].count) === 0) {
      console.log("👤 Creating default admin user...");

      const hashedPassword = await bcrypt.hash("admin123", 10);

      await pool.query(
        `INSERT INTO users (name, email, password)
         VALUES ($1, $2, $3)`,
        ["Admin", "admin@test.com", hashedPassword]
      );

      console.log(" Default admin user created");
    } else {
      console.log(" Users already exist");
    }

  } catch (error) {
    console.error(" Database initialization failed:", error);
    process.exit(1);
  }
}

export default initDatabase;
