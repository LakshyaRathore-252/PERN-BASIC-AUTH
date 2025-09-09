import { Router } from "express";
import { getUserProfile } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();


// User Routess
router.get("/getUserProfile/:id", authMiddleware, getUserProfile);


export default router;