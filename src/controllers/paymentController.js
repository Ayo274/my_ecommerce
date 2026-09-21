import axios from "axios";
import crypto from "crypto";
import Order from "../models/order.js";

export const initializePayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate("user", "email name");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.isPaid) {
      return res.status(400).json({ message: "Order is already paid" });
    }
    const paystackPayload = {
      email: req.user.email || order.user.email,
      amount: Math.round(order.totalPrice * 100),
      reference: `ORD_${order._id}_${Date.now()}`,
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
      },
      callback_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/order/${order._id}/payment-success`,
    };
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      paystackPayload,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );
    res.status(200).json(response.data.data);
  } catch (error) {
    res.status(500).json({
      message: error.response?.data?.message || error.message,
    });
  }
};
export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      },
    );
    const { status, data } = response.data;
    if (status && data.status === "success") {
      const orderId = data.metadata.orderId;
      const order = await Order.findById(orderId);
      if (order && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentResult = {
          id: data.id,
          status: data.status,
          reference: data.reference,
          email: data.customer.email,
        };
        await order.save();
      }
      return res
        .status(200)
        .json({ message: "Payment verified successfully", order });
    }
    res.status(400).json({ message: "Payment verification failed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const handlePaystackWebhook = async (req, res) => {
  try {
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(400).send("Invalid signature");
    }
    const event = req.body;

    if (event.event === "charge.success") {
      const { metadata, reference, id, customer } = event.data;
      const orderId = metadata?.orderId;

      if (orderId) {
        const order = await Order.findById(orderId);
        if (order && !order.isPaid) {
          order.isPaid = true;
          order.paidAt = new Date();
          order.paymentResult = {
            id,
            status: "success",
            reference,
            email: customer.email,
          };
          await order.save();
        }
      }
    }
    res.status(200).send("Webhook processed");
  } catch (error) {
    res.status(500).send(error.message);
  }
};
