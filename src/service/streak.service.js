import pool from "../config/connect.js";

export const updateStreakService = async (userId) => {
  const today = new Date().toISOString().split("T")[0];

  const result = await pool.query(
    "SELECT current_streak, last_active_date FROM streaks WHERE user_id = $1",
    [userId]
  );

  // First activity ever
  if (result.rows.length === 0) {
    await pool.query(
      `INSERT INTO streaks (user_id, current_streak, last_active_date)
       VALUES ($1, 1, $2)`,
      [userId, today]
    );
    return;
  }

  const { current_streak, last_active_date } = result.rows[0];

  // Already counted today
  if (last_active_date === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let newStreak = 1;

  if (last_active_date === yesterdayStr) {
    newStreak = current_streak + 1;
  }

  await pool.query(
    `UPDATE streaks
     SET current_streak = $1, last_active_date = $2
     WHERE user_id = $3`,
    [newStreak, today, userId]
  );
};

