import {
  addCommentService,
  getCommentsByTaskService,
} from "../service/comment.service.js";

export const addComment = async (req, res) => {
  try {
    const comment = await addCommentService(
      req.user.id,
      req.params.taskId,
      req.body.comment
    );

    res.status(201).json({
      message: "Comment added",
      comment,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const getCommentsByTask = async (req, res) => {
  try {
    const comments = await getCommentsByTaskService(
      req.user.id,
      req.params.taskId
    );

    res.status(200).json(comments);
  } catch {
    res.status(500).json({ message: "Failed to fetch comments" });
  }
};

import {
  updateCommentService,
  deleteCommentService,
} from "../service/comment.service.js";

export const updateComment = async (req, res) => {
  try {
    const comment = await updateCommentService(
      req.user.id,
      req.params.id,
      req.body.comment
    );

    res.status(200).json({
      message: "Comment updated",
      comment,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    await deleteCommentService(req.user.id, req.params.id);
    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

