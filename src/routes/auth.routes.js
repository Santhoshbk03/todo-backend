import express from "express";
import AuthController from "../controller/auth.controller.js";

const registerroute = express.Router();
const authController = new AuthController();

console.log("Auth routes loaded");
console.log("AuthController instance:", authController);

registerroute.post("/register", authController.registerController);
registerroute.post("/login", authController.loginController);

export default registerroute;
