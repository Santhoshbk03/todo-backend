import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  addComment,
  getCommentsByTask,
  updateComment,
  deleteComment,
} from "../controller/comment.controller.js";

const commentRoutes = express.Router();

commentRoutes.post("/:taskId", authMiddleware, addComment);
commentRoutes.get("/:taskId", authMiddleware, getCommentsByTask);
commentRoutes.put("/:id", authMiddleware, updateComment);
commentRoutes.delete("/:id", authMiddleware, deleteComment);

export default commentRoutes;
