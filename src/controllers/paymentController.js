import Stripe from "stripe";
import Order from "../models/order.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Initialize Stripe Checkout Session for an Order
// @route   POST /api/payments/create-checkout-session
// @access  Private
export const createCheckoutSession = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId).populate("user", "email name");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.isPaid) {
      return res.status(400).json({ message: "Order is already paid" });
    }

    // Map your MERN order items into Stripe line items
    const lineItems = order.orderItems.map((item) => ({
      price_data: {
        currency: "usd", // Change to "ngn" or your preferred currency code if desired
        product_data: {
          name: item.name || "E-Commerce Product",
        },
        unit_amount: Math.round(item.price * 100), // Stripe expects amounts in cents
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: req.user.email || order.user?.email,
      success_url: `${process.env.FRONTEND_URL || "https://exclusiveecommerce.vercel.app"}/order/${order._id}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || "https://exclusiveecommerce.vercel.app"}/cart`,
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
      },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe Session Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify Stripe Payment on success return
// @route   GET /api/payments/verify/:sessionId
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session && session.payment_status === "paid") {
      const orderId = session.metadata.orderId;
      const order = await Order.findById(orderId);

      if (order && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentResult = {
          id: session.payment_intent,
          status: session.payment_status,
          reference: session.id,
          email: session.customer_email,
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

// @desc    Handle Stripe Webhooks for background fulfillment
// @route   POST /api/payments/webhook
// @access  Public
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful checkout completion
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      const order = await Order.findById(orderId);
      if (order && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentResult = {
          id: session.payment_intent,
          status: "success",
          reference: session.id,
          email: session.customer_email || session.customer_details?.email,
        };
        await order.save();
      }
    }
  }

  res.status(200).json({ received: true });
};
