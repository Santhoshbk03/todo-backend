import pool from "../config/connect.js";

/* CREATE TASK */
export const createTaskService = async (userId, data) => {
  const { group_id, title, description, priority } = data;

  if (!group_id || !title) {
    throw { status: 400, message: "Group and title are required" };
  }

  // 🔐 Ensure group belongs to logged-in user
  const groupCheck = await pool.query(
    "SELECT id FROM groups WHERE id = $1 AND user_id = $2",
    [group_id, userId]
  );

  if (groupCheck.rows.length === 0) {
    throw { status: 403, message: "Invalid group access" };
  }

  const result = await pool.query(
    `INSERT INTO tasks (user_id, group_id, title, description, priority, status, progress, completed)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      userId, 
      group_id, 
      title, 
      description || null, 
      priority || "MEDIUM", 
      "PENDING",  // Default status
      0,          // Default progress
      false       // Default completed
    ]
  );

  return result.rows[0];
};

/* GET TASKS BY GROUP */
export const getTasksByGroupService = async (userId, groupId) => {
  const result = await pool.query(
    `SELECT t.*
     FROM tasks t
     JOIN groups g ON g.id = t.group_id
     WHERE g.id = $1 AND g.user_id = $2
     ORDER BY t.created_at DESC`,
    [groupId, userId]
  );

  return result.rows;
};

/* UPDATE TASK */
export const updateTaskService = async (userId, taskId, data) => {
  const { status, priority, progress, title, description } = data;

  // 🔐 Check task ownership
  const taskCheck = await pool.query(
    `SELECT t.id, t.status as current_status, t.progress as current_progress
     FROM tasks t
     JOIN groups g ON g.id = t.group_id
     WHERE t.id = $1 AND g.user_id = $2`,
    [taskId, userId]
  );

  if (taskCheck.rows.length === 0) {
    throw { status: 404, message: "Task not found" };
  }

  const currentTask = taskCheck.rows[0];
  
  // 🧠 Status ↔ Progress sync
  let finalStatus = status || currentTask.current_status;
  let finalProgress = progress || currentTask.current_progress;
  let finalCompleted = false;

  // If status is provided, update progress accordingly
  if (status === 'DONE') {
    finalProgress = 100;
    finalCompleted = true;
  } else if (status === 'TODO' || status === 'PENDING') {
    finalProgress = 0;
    finalCompleted = false;
  } else if (status === 'IN_PROGRESS') {
    // Keep current progress or set to a default
    finalProgress = finalProgress > 0 ? finalProgress : 25;
    finalCompleted = false;
  }

  // If progress is provided (without status), update status accordingly
  if (progress !== undefined && status === undefined) {
    if (progress === 100) {
      finalStatus = 'DONE';
      finalCompleted = true;
    } else if (progress > 0 && progress < 100) {
      finalStatus = 'IN_PROGRESS';
      finalCompleted = false;
    } else if (progress === 0) {
      finalStatus = 'PENDING';
      finalCompleted = false;
    }
  }

  console.log('📝 Update task values:', {
    taskId,
    title,
    description,
    priority,
    finalStatus,
    finalProgress,
    finalCompleted
  });

  const result = await pool.query(
    `UPDATE tasks
     SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       priority = COALESCE($3, priority),
       status = COALESCE($4, status),
       progress = COALESCE($5, progress),
       completed = $6,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $7
     RETURNING *`,
    [
      title || null,
      description || null,
      priority || null,
      finalStatus,
      finalProgress,
      finalCompleted,
      taskId
    ]
  );

  return result.rows[0];
};

/* DELETE TASK */
export const deleteTaskService = async (userId, taskId) => {
  const result = await pool.query(
    `DELETE FROM tasks
     WHERE id = $1
       AND group_id IN (
         SELECT id FROM groups WHERE user_id = $2
       )
     RETURNING id`,
    [taskId, userId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: "Task not found" };
  }
};

/* GET SINGLE TASK (Optional but useful) */
export const getTaskByIdService = async (userId, taskId) => {
  const result = await pool.query(
    `SELECT t.*, g.name as group_name
     FROM tasks t
     JOIN groups g ON g.id = t.group_id
     WHERE t.id = $1 AND g.user_id = $2`,
    [taskId, userId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: "Task not found" };
  }

  return result.rows[0];
};