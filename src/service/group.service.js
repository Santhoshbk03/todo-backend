import pool from "../config/connect.js";

/* CREATE */
export const createGroupService = async (userId, { name, description }) => {
  if (!name) {
    throw { status: 400, message: "Group name is required" };
  }

  const result = await pool.query(
    `INSERT INTO groups (user_id, name, description)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, name, description || null]
  );

  return result.rows[0];
};

/* READ */
export const getGroupsService = async (userId) => {
  const result = await pool.query(
    `SELECT id, name, description, created_at
     FROM groups
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

/* UPDATE */
export const updateGroupService = async (userId, groupId, data) => {
  const { name, description } = data;

  const result = await pool.query(
    `UPDATE groups
     SET name = COALESCE($1, name),
         description = COALESCE($2, description)
     WHERE id = $3 AND user_id = $4
     RETURNING *`,
    [name, description, groupId, userId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: "Group not found" };
  }

  return result.rows[0];
};

/* DELETE */
export const deleteGroupService = async (userId, groupId) => {
  const result = await pool.query(
    `DELETE FROM groups
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [groupId, userId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: "Group not found" };
  }
};
