import express from "express";
import registerroute from "./auth.routes.js";
import groupRoutes from "./group.routes.js";
import taskRoutes from "./task.routes.js";
import commentRoutes from "./comment.routes.js";
import dashboardRoutes from "./dashboard.routes.js";

const indexrouter = express.Router();

console.log("Index router loaded");
indexrouter.use("/auth", registerroute);
indexrouter.use("/groups", groupRoutes);
indexrouter.use("/tasks", taskRoutes);
indexrouter.use("/comments", commentRoutes);
indexrouter.use("/dashboard", dashboardRoutes);


export default indexrouter;