import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { getDashboard, getStreak } from "../controller/dashboard.controller.js";

const dashboardRoutes = express.Router();

dashboardRoutes.get("/", authMiddleware, getDashboard);
dashboardRoutes.get("/streak", authMiddleware, getStreak);

export default dashboardRoutes;