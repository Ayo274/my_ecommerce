import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";

const router = express.Router();

// ==========================================
// PUBLIC AUTHENTICATION ROUTES (CRITICAL)
// ==========================================
router.post("/register", registerUser);
router.post("/login", loginUser);

// ==========================================
// COMMENTED OUT UNTIL YOU FIX THE CONTROLLER
// ==========================================
// import { protect } from "../middlewares/authMiddleware.js";
// import { getUserProfile } from "../controllers/authController.js";
// router.get("/profile", protect, getUserProfile);

export default router;
