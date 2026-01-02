import pool from "../config/connect.js";

export const getDashboardService = async (userId) => {
  try {
    // Groups count - FIXED: Using user_id directly
    const groupsResult = await pool.query(
      "SELECT COUNT(*) FROM groups WHERE user_id = $1",
      [userId]
    );

    // Task stats - FIXED: Using 'completed' boolean instead of 'status' string
    const taskStatsResult = await pool.query(
      `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE completed = true) AS completed,
        COUNT(*) FILTER (WHERE completed = false) AS active
      FROM tasks
      WHERE user_id = $1
      `,
      [userId]
    );

    // Priority split - REMOVED: No priority column in your schema
    // If you need priority, you'll need to add it to tasks table
    const priorityResult = { rows: [] }; // Empty since no priority column

    // Recent tasks - FIXED: Using correct columns
    const recentTasksResult = await pool.query(
      `
      SELECT 
        t.id, 
        t.title, 
        t.description,
        t.completed,
        t.created_at,
        t.updated_at,
        g.name as group_name,
        g.id as group_id
      FROM tasks t
      LEFT JOIN groups g ON g.id = t.group_id
      WHERE t.user_id = $1
      ORDER BY COALESCE(t.updated_at, t.created_at) DESC
      LIMIT 10
      `,
      [userId]
    );

    // Weekly completion rate - FIXED: Using completed boolean
    const weeklyStatsResult = await pool.query(
      `
      SELECT 
        DATE_TRUNC('day', t.created_at) as day,
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE t.completed = true) as completed_tasks
      FROM tasks t
      WHERE t.user_id = $1 
        AND t.created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE_TRUNC('day', t.created_at)
      ORDER BY day
      `,
      [userId]
    );

    // Get user streaks - FIXED: Using user_streaks table
    const streakResult = await pool.query(
      `
      SELECT 
        COUNT(*) FILTER (WHERE completed = true) as current_streak
      FROM user_streaks
      WHERE user_id = $1 
        AND streak_date >= CURRENT_DATE - INTERVAL '7 days'
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
      streak: {
        currentStreak: Number(streakResult.rows[0]?.current_streak || 0),
        // Add last 7 days streak details
        last7Days: await getLast7DaysStreak(userId)
      },
      priority: priorityResult.rows, // Empty for now
      recentTasks: recentTasksResult.rows.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        completed: task.completed,
        groupName: task.group_name || 'No Group',
        groupId: task.group_id,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      })),
      weeklyStats: weeklyStatsResult.rows.map(row => ({
        day: new Date(row.day).toLocaleDateString('en-US', { weekday: 'short' }),
        total: Number(row.total_tasks),
        completed: Number(row.completed_tasks),
        completionRate: row.total_tasks > 0 
          ? Math.round((Number(row.completed_tasks) / Number(row.total_tasks)) * 100)
          : 0
      }))
    };
  } catch (error) {
    console.error('Dashboard service error:', error);
    throw error;
  }
};

// Helper function to get last 7 days streak
async function getLast7DaysStreak(userId) {
  try {
    const result = await pool.query(
      `
      SELECT 
        streak_date,
        completed
      FROM user_streaks
      WHERE user_id = $1 
        AND streak_date >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY streak_date
      `,
      [userId]
    );
    
    return result.rows.map(row => ({
      date: row.streak_date,
      completed: row.completed
    }));
  } catch (error) {
    console.error('Streak helper error:', error);
    return [];
  }
}

export const getStreakService = async (userId) => {
  try {
    // Get current streak (consecutive completed days up to today)
    const result = await pool.query(
      `
      WITH RECURSIVE streak_days AS (
        SELECT 
          streak_date,
          completed,
          1 as consecutive
        FROM user_streaks
        WHERE user_id = $1 
          AND streak_date = CURRENT_DATE
        
        UNION ALL
        
        SELECT 
          us.streak_date,
          us.completed,
          CASE 
            WHEN us.completed = true THEN sd.consecutive + 1
            ELSE 1
          END
        FROM user_streaks us
        JOIN streak_days sd ON us.streak_date = sd.streak_date - INTERVAL '1 day'
        WHERE us.user_id = $1
      )
      SELECT 
        MAX(consecutive) as current_streak,
        MAX(streak_date) as last_active_date
      FROM streak_days
      WHERE completed = true
      `,
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].current_streak) {
      // Check for any streak data
      const fallbackResult = await pool.query(
        `
        SELECT 
          MAX(streak_date) as last_active_date
        FROM user_streaks
        WHERE user_id = $1 AND completed = true
        `,
        [userId]
      );
      
      return { 
        currentStreak: 0, 
        lastActiveDate: fallbackResult.rows[0]?.last_active_date || null 
      };
    }

    return {
      currentStreak: Number(result.rows[0].current_streak),
      lastActiveDate: result.rows[0].last_active_date
    };
  } catch (error) {
    console.error('Streak service error:', error);
    // Fallback to simple streak calculation
    return await getSimpleStreak(userId);
  }
};

// Fallback streak calculation
async function getSimpleStreak(userId) {
  try {
    const result = await pool.query(
      `
      SELECT 
        streak_date,
        completed
      FROM user_streaks
      WHERE user_id = $1
      ORDER BY streak_date DESC
      LIMIT 30
      `,
      [userId]
    );
    
    let streak = 0;
    let lastDate = null;
    const today = new Date().toISOString().split('T')[0];
    
    // Check consecutive days from today backwards
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows[i];
      const rowDate = new Date(row.streak_date).toISOString().split('T')[0];
      
      if (row.completed) {
        // If first iteration, set initial values
        if (i === 0) {
          lastDate = rowDate;
          streak = 1;
        } 
        // Check if consecutive day
        else if (lastDate) {
          const lastDateObj = new Date(lastDate);
          const currentDateObj = new Date(rowDate);
          const diffDays = (lastDateObj - currentDateObj) / (1000 * 60 * 60 * 24);
          
          if (diffDays === 1) {
            streak++;
            lastDate = rowDate;
          } else {
            break;
          }
        }
      } else {
        break;
      }
    }
    
    return {
      currentStreak: streak,
      lastActiveDate: result.rows[0]?.streak_date || null
    };
  } catch (error) {
    console.error('Simple streak error:', error);
    return { currentStreak: 0, lastActiveDate: null };
  }
}