import express from "express";
import {
  initializePayment,
  verifyPayment,
  handlePaystackWebhook,
} from "../controllers/paymentController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/initialize", protect, initializePayment);
router.get("/verify/:reference", protect, verifyPayment);
router.post("/webhook", handlePaystackWebhook); 

export default router;

