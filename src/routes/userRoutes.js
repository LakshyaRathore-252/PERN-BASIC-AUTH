import { Router } from "express";
import { getUserProfile, getUserProfileById } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();


// User Routess
router.get("/getUserProfile/:id", authMiddleware, getUserProfileById);
router.get("/me", authMiddleware, getUserProfile);


export default router;