import AuthService from "../service/auth.service.js";

class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  registerController = async (req, res) => {
    try {
      const user = await this.authService.registerService(req.body);

      res.status(201).json({
        message: "User registered successfully",
        user,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || "Internal server error",
      });
    }
  };

  loginController = async (req, res) => {
    try {
      const user = await this.authService.loginService(req.body);

      res.status(200).json({
        message: "Login successful",
        user,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || "Internal server error",
      });
    }
  };
}

export default AuthController;