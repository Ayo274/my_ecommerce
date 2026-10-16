import express from "express";
import {
  createCheckoutSession,
  verifyPayment,
  handleStripeWebhook,
} from "../controllers/paymentController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create-checkout-session", protect, createCheckoutSession);
router.get("/verify/:sessionId", protect, verifyPayment);
router.post("/webhook", handleStripeWebhook);

export default router;
