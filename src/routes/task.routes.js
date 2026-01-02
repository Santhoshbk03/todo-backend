import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  createTask,
  deleteTask,
  getTasksByGroup,
  updateTask,
} from "../controller/task.controller.js";

const taskRoutes = express.Router();

taskRoutes.post("/", authMiddleware, createTask);
taskRoutes.get("/group/:groupId", authMiddleware, getTasksByGroup);
taskRoutes.put("/:id", authMiddleware, updateTask);
taskRoutes.delete("/:id", authMiddleware, deleteTask);



export default taskRoutes;
