import express from "express";
import { getDashboardStats } from "../controllers/adminController.js";
import { protect, admin } from "../middlewares/authMiddleware.js"; 

const router = express.Router();

router.use(protect, admin);

router.get("/stats", getDashboardStats);

export default router;