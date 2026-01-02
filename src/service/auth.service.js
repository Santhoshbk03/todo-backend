import pool from "../config/connect.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


class AuthService {
  registerService = async ({ name, email, password }) => {
    if (!name || !email || !password) {
      throw { status: 400, message: "All fields are required" };
    }
    const existingUser = await pool.query("SELECT id FROM users WHERE email=$1", [
      email,
    ]);
    if (existingUser.rows.length > 0) {
      throw { status: 409, message: "Email already exists" };
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name, email, hashedPassword]
    );

    return result.rows[0];
  };

  loginService = async ({ email, password }) => {
    if (!email || !password) {
      throw { status: 400, message: "Email and password are required" };
    }

    const result = await pool.query(
      "SELECT id, name, email, password FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      throw { status: 401, message: "Invalid email or password" };
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw { status: 401, message: "Invalid email or password" };
    }

    const token = jwt.sign({ id: user.id, email: user.email },process.env.JWT_SECRET_KEY ,{ expiresIn: process.env.JWT_EXPIRES_IN } )

    const { password: _, ...data  } = user;
    return {data,token};
  };
}

export default AuthService; 