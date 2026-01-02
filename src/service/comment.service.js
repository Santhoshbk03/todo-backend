import pool from "../config/connect.js";

/* ADD COMMENT */
export const addCommentService = async (userId, taskId, comment) => {
  if (!comment) {
    throw { status: 400, message: "Comment is required" };
  }

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

  const result = await pool.query(
    `INSERT INTO comments (task_id, user_id, comment)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [taskId, userId, comment]
  );

  return result.rows[0];
};

/* GET COMMENTS BY TASK */
export const getCommentsByTaskService = async (userId, taskId) => {
  const result = await pool.query(
    `SELECT c.id, c.comment, c.created_at, u.name AS author
     FROM comments c
     JOIN users u ON u.id = c.user_id
     JOIN tasks t ON t.id = c.task_id
     JOIN groups g ON g.id = t.group_id
     WHERE c.task_id = $1 AND g.user_id = $2
     ORDER BY c.created_at ASC`,
    [taskId, userId]
  );

  return result.rows;
};


export const updateCommentService = async (userId, commentId, comment) => {
  if (!comment) {
    throw { status: 400, message: "Comment is required" };
  }

  const result = await pool.query(
    `UPDATE comments
     SET comment = $1
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [comment, commentId, userId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: "Comment not found or access denied" };
  }

  return result.rows[0];
};


export const deleteCommentService = async (userId, commentId) => {
  const result = await pool.query(
    `DELETE FROM comments
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [commentId, userId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: "Comment not found or access denied" };
  }
};
