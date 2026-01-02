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
    "PENDING", 
    0,
    false
  ]
);


let finalStatus = status;
let finalProgress = progress;
let finalCompleted = completed;

if (status === 'DONE') {
  finalProgress = 100;
  finalCompleted = true;
} else if (progress === 100) {
  finalStatus = 'DONE';
  finalCompleted = true;
} else if (progress > 0) {
  finalStatus = 'IN_PROGRESS';
}

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

export const updateTaskService = async (userId, taskId, data) => {
  const { status, priority, progress, title, description } = data;

  // 🔐 Check task ownership
  const taskCheck = await pool.query(
    `SELECT t.id
     FROM tasks t
     JOIN groups g ON g.id = t.group_id
     WHERE t.id = $1 AND g.user_id = $2`,
    [taskId, userId]
  );

  if (taskCheck.rows.length === 0) {
    throw { status: 404, message: "Task not found" };
  }

  // 🧠 Status ↔ Progress sync
  let finalStatus = status;
  let finalProgress = progress;

  if (status === "TODO") {
    finalProgress = 0;
  }

  if (status === "DONE") {
    finalProgress = 100;
  }

  if (progress === 100) {
    finalStatus = "DONE";
  }

  const result = await pool.query(
    `UPDATE tasks
     SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       priority = COALESCE($3, priority),
       status = COALESCE($4, status),
       progress = COALESCE($5, progress),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $6
     RETURNING *`,
    [
      title,
      description,
      priority,
      finalStatus,
      finalProgress,
      taskId,
    ]
  );

  return result.rows[0];
};
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
