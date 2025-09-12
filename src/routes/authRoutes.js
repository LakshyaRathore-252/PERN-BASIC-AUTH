import { Router } from "express";
import {
  signup,
  verifySignupOtp,
  signin,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

// Signup + OTP verification
router.post("/signup", signup);
router.post("/verify-otp", verifySignupOtp);

// Login
router.post("/signin", signin);

// Password reset
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


// Change Password...
router.post("/change-password", authMiddleware, changePassword);


// Logout...
router.post("/logout", authMiddleware, logout);

export default router;
