import express from "express";
import {
  createCoupon,
  validateCoupon,
  getCoupons,
  deleteCoupon,
} from "../controllers/couponController.js";
import { protect, admin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/validate", protect, validateCoupon);

// Admin routes
router.post("/", protect, admin, createCoupon);
router.get("/", protect, admin, getCoupons);
router.delete("/:id", protect, admin, deleteCoupon);

export default router;
