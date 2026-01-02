import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { getDashboard } from "../controller/dashboard.controller.js";

const dashboardRoutes = express.Router();

dashboardRoutes.get("/", authMiddleware, getDashboard);

export default dashboardRoutes;