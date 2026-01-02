import pool from "../config/connect.js";

export const getDashboardService = async (userId) => {
  try {
    console.log(`📊 Fetching dashboard for user ${userId}`);

    // 1. Groups count
    const groupsResult = await pool.query(
      "SELECT COUNT(*) FROM groups WHERE user_id = $1",
      [userId]
    );

    // 2. Task stats - Convert completed boolean to status
    const taskStatsResult = await pool.query(
      `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'DONE') AS completed,
        COUNT(*) FILTER (WHERE status != 'DONE') AS active
      FROM tasks
      WHERE user_id = $1
      `,
      [userId]
    );

    // 3. Priority distribution - Now this will work
    const priorityResult = await pool.query(
      `
      SELECT priority, COUNT(*) AS count
      FROM tasks
      WHERE user_id = $1 AND priority IS NOT NULL
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

    // 4. Recent tasks - Include all fields frontend needs
    const recentTasksResult = await pool.query(
      `
      SELECT 
        t.id, 
        t.title, 
        t.description,
        t.status,
        t.priority,
        t.progress,
        t.completed,
        t.created_at,
        t.updated_at,
        g.name as group_name,
        g.id as group_id
      FROM tasks t
      LEFT JOIN groups g ON g.id = t.group_id
      WHERE t.user_id = $1
      ORDER BY t.updated_at DESC, t.created_at DESC
      LIMIT 10
      `,
      [userId]
    );

    // 5. Weekly completion rate - Using status field
    const weeklyStatsResult = await pool.query(
      `
      SELECT 
        DATE_TRUNC('day', t.created_at) as day,
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE t.status = 'DONE') as completed_tasks
      FROM tasks t
      WHERE t.user_id = $1 
        AND t.created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE_TRUNC('day', t.created_at)
      ORDER BY day
      `,
      [userId]
    );

    // 6. Get today's streak
    const todayStreakResult = await pool.query(
      `
      SELECT completed 
      FROM user_streaks 
      WHERE user_id = $1 AND streak_date = CURRENT_DATE
      `,
      [userId]
    );

    // 7. Current streak calculation
    const streakResult = await pool.query(
      `
      WITH consecutive_days AS (
        SELECT 
          streak_date,
          completed,
          ROW_NUMBER() OVER (ORDER BY streak_date DESC) as rn,
          streak_date - (ROW_NUMBER() OVER (ORDER BY streak_date DESC) * INTERVAL '1 day') as diff
        FROM user_streaks
        WHERE user_id = $1 
          AND completed = true
          AND streak_date >= CURRENT_DATE - INTERVAL '30 days'
      ),
      grouped_days AS (
        SELECT 
          COUNT(*) as streak_length
        FROM consecutive_days
        GROUP BY diff
        ORDER BY streak_length DESC
        LIMIT 1
      )
      SELECT COALESCE((SELECT streak_length FROM grouped_days), 0) as current_streak
      `,
      [userId]
    );

    // Calculate completion rate
    const totalTasks = Number(taskStatsResult.rows[0]?.total || 0);
    const completedTasks = Number(taskStatsResult.rows[0]?.completed || 0);
    const completionRate = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    // Format recent tasks for frontend
    const recentTasks = recentTasksResult.rows.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status || 'PENDING',
      priority: task.priority || 'MEDIUM',
      progress: task.progress || 0,
      completed: task.completed,
      group_name: task.group_name || 'No Group',
      group_id: task.group_id,
      created_at: task.created_at,
      updated_at: task.updated_at || task.created_at
    }));

    // Format weekly stats
    const weeklyStats = weeklyStatsResult.rows.map(row => ({
      day: new Date(row.day).toLocaleDateString('en-US', { weekday: 'short' }),
      total: Number(row.total_tasks || 0),
      completed: Number(row.completed_tasks || 0),
      completionRate: row.total_tasks > 0 
        ? Math.round((Number(row.completed_tasks || 0) / Number(row.total_tasks || 1)) * 100)
        : 0
    }));

    // Format priority data
    const priorityData = priorityResult.rows.map(row => ({
      priority: row.priority,
      count: Number(row.count || 0)
    }));

    // Build the response object that matches frontend expectations
    const response = {
      groups: Number(groupsResult.rows[0]?.count || 0),
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        active: Number(taskStatsResult.rows[0]?.active || 0),
        completionRate: completionRate
      },
      streak: {
        currentStreak: Number(streakResult.rows[0]?.current_streak || 0),
        todayCompleted: todayStreakResult.rows[0]?.completed || false
      },
      priority: priorityData,
      recentTasks: recentTasks,
      weeklyStats: weeklyStats
    };

    console.log(`✅ Dashboard data fetched for user ${userId}:`, {
      groups: response.groups,
      tasks: response.tasks.total,
      recentTasks: response.recentTasks.length
    });

    return response;

  } catch (error) {
    console.error('❌ Dashboard service error:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Return default structure that matches frontend expectations
    return {
      groups: 0,
      tasks: {
        total: 0,
        completed: 0,
        active: 0,
        completionRate: 0
      },
      streak: {
        currentStreak: 0,
        todayCompleted: false
      },
      priority: [],
      recentTasks: [],
      weeklyStats: []
    };
  }
};

export const getStreakService = async (userId) => {
  try {
    // Simple streak calculation for last 30 days
    const result = await pool.query(
      `
      SELECT 
        streak_date,
        completed,
        ROW_NUMBER() OVER (ORDER BY streak_date DESC) as rn
      FROM user_streaks
      WHERE user_id = $1
        AND streak_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY streak_date DESC
      `,
      [userId]
    );

    // Calculate consecutive completed days
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows[i];
      
      if (row.completed) {
        if (i === 0) {
          // First day
          currentStreak = 1;
        } else {
          const prevDate = new Date(result.rows[i-1].streak_date);
          const currentDate = new Date(row.streak_date);
          const diffDays = Math.abs((prevDate - currentDate) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      } else {
        break;
      }
    }

    const lastActive = result.rows.length > 0 ? result.rows[0].streak_date : null;

    return {
      currentStreak,
      lastActiveDate: lastActive,
      recentActivity: result.rows.slice(0, 7).map(row => ({
        date: row.streak_date,
        completed: row.completed
      }))
    };

  } catch (error) {
    console.error('❌ Streak service error:', error);
    return { 
      currentStreak: 0, 
      lastActiveDate: null,
      recentActivity: []
    };
  }
};

// Helper function for weekly streak
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
    console.error('❌ Streak helper error:', error);
    return [];
  }
}




