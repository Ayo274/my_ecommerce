import Order from "../models/order.js";
import Cart from "../models/cart.js";
import Product from "../models/product.js";
import Coupon from "../models/coupon.js";
import Address from "../models/address.js";

export const createOrder = async (req, res) => {
  try {
    const {
      shippingAddress,
      shippingAddressId,
      paymentMethod = "Paystack",
      couponCode,
      shippingPrice = 0,
      taxPrice = 0,
    } = req.body;

    let finalShippingAddress = null;

    if (shippingAddressId) {
      const addressDoc = await Address.findOne({
        _id: shippingAddressId,
        user: req.user._id,
      });
      if (addressDoc) {
        finalShippingAddress = {
          fullName: addressDoc.fullName,
          phone: addressDoc.phone,
          streetAddress: addressDoc.streetAddress || addressDoc.address,
          city: addressDoc.city,
          state: addressDoc.state || "",
          postalCode: addressDoc.postalCode,
          country: addressDoc.country,
        };
      }
    } else if (shippingAddress) {
      finalShippingAddress = {
        fullName: shippingAddress.fullName || req.user.name || "Customer",
        phone: shippingAddress.phone || "",
        streetAddress: shippingAddress.streetAddress || shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state || "",
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
      };
    }

    if (!finalShippingAddress || !finalShippingAddress.streetAddress) {
      return res.status(400).json({
        message:
          "Valid shipping address is required (provide shippingAddress object or valid shippingAddressId)",
      });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
    );
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }

    const orderItems = [];
    let itemsPrice = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        return res.status(404).json({
          message: `Product ${item.product?.title || "item"} no longer exists`,
        });
      }

      const variant = product.variants.find(
        (v) =>
          v.stockKeepingUnit === item.variantSku || v.sku === item.variantSku,
      );

      if (!variant) {
        return res
          .status(400)
          .json({ message: `Variant SKU ${item.variantSku} not found` });
      }

      if (variant.stockQuantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.title} (${variant.color || ""} ${variant.size || ""}). Requested: ${item.quantity}, Available: ${variant.stockQuantity}`,
        });
      }

      const effectiveBasePrice =
        product.basePrice * (1 - (product.discountPercentage || 0) / 100);
      const unitPrice = effectiveBasePrice + (variant.priceAdjustment || 0);

      itemsPrice += unitPrice * item.quantity;

      orderItems.push({
        product: product._id,
        title: product.title,
        variantSku: item.variantSku,
        size: variant.size || "",
        color: variant.color || "",
        quantity: item.quantity,
        priceAtPurchase: unitPrice,
        image:
          product.images && product.images.length > 0 ? product.images[0] : "",
      });
    }

    let discountAmount = 0;
    let couponDoc = null;

    if (couponCode) {
      couponDoc = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
      });

      if (couponDoc && new Date(couponDoc.expirationDate) >= new Date()) {
        if (itemsPrice >= (couponDoc.minPurchase || 0)) {
          if (couponDoc.discountType === "percentage") {
            discountAmount = (itemsPrice * couponDoc.discountAmount) / 100;
            if (
              couponDoc.maxDiscount &&
              discountAmount > couponDoc.maxDiscount
            ) {
              discountAmount = couponDoc.maxDiscount;
            }
          } else {
            discountAmount = couponDoc.discountAmount;
          }

          couponDoc.usedCount = (couponDoc.usedCount || 0) + 1;
          await couponDoc.save();
        }
      }
    }

    const totalPrice =
      itemsPrice + Number(shippingPrice) + Number(taxPrice) - discountAmount;

    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress: finalShippingAddress,
      paymentMethod,
      coupon: couponDoc ? couponDoc._id : null,
      itemsPrice,
      taxPrice: Number(taxPrice),
      shippingPrice: Number(shippingPrice),
      discountAmount,
      totalPrice,
    });

    for (const item of cart.items) {
      await Product.updateOne(
        { _id: item.product._id },
        { $inc: { "variants.$[elem].stockQuantity": -item.quantity } },
        {
          arrayFilters: [{ "elem.stockKeepingUnit": item.variantSku }],
        },
      );
    }
    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "fullName email",
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this order" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "id fullName email")
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, isPaid } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
      if (orderStatus === "delivered") {
        order.deliveredAt = Date.now();
      }
    }

    if (isPaid !== undefined) {
      order.isPaid = isPaid;
      if (isPaid) order.paidAt = Date.now();
    }

    const updatedOrder = await order.save();
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.status = "Delivered";

    const updatedOrder = await order.save();
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "id name email")
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};