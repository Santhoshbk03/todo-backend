import pool from "../config/connect.js";

export const getDashboardService = async (userId) => {
  // Groups count
  const groupsResult = await pool.query(
    "SELECT COUNT(*) FROM groups WHERE user_id = $1",
    [userId]
  );

  // Task stats
  const taskStatsResult = await pool.query(
    `
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'DONE') AS completed,
      COUNT(*) FILTER (WHERE status != 'DONE') AS active
    FROM tasks t
    JOIN groups g ON g.id = t.group_id
    WHERE g.user_id = $1
    `,
    [userId]
  );

  // Priority split
  const priorityResult = await pool.query(
    `
    SELECT priority, COUNT(*) AS count
    FROM tasks t
    JOIN groups g ON g.id = t.group_id
    WHERE g.user_id = $1 AND priority IS NOT NULL
    GROUP BY priority
    ORDER BY 
      CASE priority 
        WHEN 'HIGH' THEN 1
        WHEN 'MEDIUM' THEN 2
        WHEN 'LOW' THEN 3
        ELSE 4
      END
    `,
    [userId]
  );

  // Recent tasks
  const recentTasksResult = await pool.query(
    `
    SELECT t.id, t.title, t.status, t.priority, t.updated_at,
           g.name as group_name
    FROM tasks t
    JOIN groups g ON g.id = t.group_id
    WHERE g.user_id = $1
    ORDER BY t.updated_at DESC
    LIMIT 10
    `,
    [userId]
  );

  // Weekly completion rate
  const weeklyStatsResult = await pool.query(
    `
    SELECT 
      DATE_TRUNC('day', t.created_at) as day,
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE t.status = 'DONE') as completed_tasks
    FROM tasks t
    JOIN groups g ON g.id = t.group_id
    WHERE g.user_id = $1 
      AND t.created_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY DATE_TRUNC('day', t.created_at)
    ORDER BY day
    `,
    [userId]
  );

  return {
    groups: Number(groupsResult.rows[0].count),
    tasks: {
      total: Number(taskStatsResult.rows[0].total),
      completed: Number(taskStatsResult.rows[0].completed),
      active: Number(taskStatsResult.rows[0].active),
      completionRate: taskStatsResult.rows[0].total > 0 
        ? Math.round((Number(taskStatsResult.rows[0].completed) / Number(taskStatsResult.rows[0].total)) * 100)
        : 0
    },
    priority: priorityResult.rows,
    recentTasks: recentTasksResult.rows,
    weeklyStats: weeklyStatsResult.rows.map(row => ({
      day: new Date(row.day).toLocaleDateString('en-US', { weekday: 'short' }),
      total: Number(row.total_tasks),
      completed: Number(row.completed_tasks)
    }))
  };
};

export const getStreakService = async (userId) => {
  const result = await pool.query(
    "SELECT current_streak, last_active_date FROM streaks WHERE user_id = $1",
    [userId]
  );

  if (result.rows.length === 0) {
    return { currentStreak: 0, lastActiveDate: null };
  }

  return {
    currentStreak: result.rows[0].current_streak,
    lastActiveDate: result.rows[0].last_active_date
  };
};