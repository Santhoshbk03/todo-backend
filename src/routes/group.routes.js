import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  createGroup,
  getGroups,
  updateGroup,
  deleteGroup,
} from "../controller/group.controller.js";

const groupRoutes = express.Router();

groupRoutes.post("/", authMiddleware, createGroup);
groupRoutes.get("/", authMiddleware, getGroups);
groupRoutes.put("/:id", authMiddleware, updateGroup);
groupRoutes.delete("/:id", authMiddleware, deleteGroup);

export default groupRoutes;
