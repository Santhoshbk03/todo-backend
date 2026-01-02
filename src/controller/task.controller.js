import { updateStreakService } from "../service/streak.service.js";
import {
  createTaskService,
  deleteTaskService,
  getTasksByGroupService,
  updateTaskService,
} from "../service/task.service.js";

export const createTask = async (req, res) => {
  try {
    const task = await createTaskService(req.user.id, req.body);
    res.status(201).json({ message: "Task created", task });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const getTasksByGroup = async (req, res) => {
  try {
    const tasks = await getTasksByGroupService(
      req.user.id,
      req.params.groupId
    );
    res.status(200).json(tasks);
  } catch {
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};


export const updateTask = async (req, res) => {
  try {
    const task = await updateTaskService(
      req.user.id,
      req.params.id,
      req.body
    );


      await updateStreakService(req.user.id);
    res.status(200).json({
      message: "Task updated",
      task,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Internal server error",
    });
  }
};


export const deleteTask = async (req, res) => {
  try {
    await deleteTaskService(req.user.id, req.params.id);
    res.status(200).json({ message: "Task deleted" });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Internal server error",
    });
  }
};