import Order from "../models/order.js";
import Cart from "../models/cart.js";
import Product from "../models/product.js";
import Coupon from "../models/coupon.js";
import Address from "../models/address.js";

export const createOrder = async (req, res) => {
  try {
    const {
      orderItems: bodyOrderItems,
      shippingAddress,
      shippingAddressId,
      paymentMethod = "Cash on delivery",
      couponCode,
      shippingPrice = 0,
      taxPrice = 0,
      totalPrice: bodyTotalPrice,
    } = req.body;

    // 1. Resolve & Normalize Shipping Address
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
        fullName:
          shippingAddress.fullName ||
          shippingAddress.firstName ||
          req.user.name ||
          "Customer",
        phone: shippingAddress.phone || shippingAddress.phoneNumber || "",
        streetAddress: shippingAddress.streetAddress || shippingAddress.address,
        city: shippingAddress.city || shippingAddress.townCity || "N/A",
        state: shippingAddress.state || "",
        postalCode: shippingAddress.postalCode || "00000",
        country: shippingAddress.country || "N/A",
      };
    }

    if (!finalShippingAddress || !finalShippingAddress.streetAddress) {
      return res.status(400).json({
        message:
          "Valid shipping address with a street address and city/town is required.",
      });
    }

    // 2. Resolve Cart Items (Accept req.body.orderItems or fallback to DB Cart)
    let rawItems = [];

    if (Array.isArray(bodyOrderItems) && bodyOrderItems.length > 0) {
      rawItems = bodyOrderItems.map((item) => ({
        product: item.product || item._id,
        quantity: item.qty || item.quantity || 1,
        variantSku: item.variantSku || null,
        price: item.price,
        title: item.title,
        image: item.image,
      }));
    } else {
      const dbCart = await Cart.findOne({ user: req.user._id }).populate(
        "items.product",
      );
      if (dbCart && dbCart.items.length > 0) {
        rawItems = dbCart.items.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          variantSku: item.variantSku || null,
        }));
      }
    }

    if (rawItems.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }

    // 3. Process Order Items & Pricing
    const orderItems = [];
    let itemsPrice = 0;

    for (const item of rawItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          message: `Product ${item.title || "item"} no longer exists`,
        });
      }

      let unitPrice = item.price;
      let variantSku = item.variantSku || "";
      let size = "";
      let color = "";

      // Check if product uses variants
      if (
        Array.isArray(product.variants) &&
        product.variants.length > 0 &&
        item.variantSku
      ) {
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
            message: `Insufficient stock for ${product.title} (${variant.color || ""} ${variant.size || ""})`,
          });
        }

        const effectiveBasePrice =
          (product.basePrice || product.price || 0) *
          (1 - (product.discountPercentage || 0) / 100);
        unitPrice = effectiveBasePrice + (variant.priceAdjustment || 0);
        size = variant.size || "";
        color = variant.color || "";

        // Deduct variant stock
        await Product.updateOne(
          { _id: product._id },
          { $inc: { "variants.$[elem].stockQuantity": -item.quantity } },
          { arrayFilters: [{ "elem.stockKeepingUnit": item.variantSku }] },
        );
      } else {
        // Fallback pricing for simple products without variants
        if (unitPrice === undefined || unitPrice === null) {
          unitPrice =
            product.price ??
            (product.basePrice
              ? product.basePrice *
                (1 - (product.discountPercentage || 0) / 100)
              : 0);
        }

        // Deduct simple countInStock
        if (typeof product.countInStock === "number") {
          product.countInStock = Math.max(
            0,
            product.countInStock - item.quantity,
          );
          await product.save();
        }
      }

      itemsPrice += unitPrice * item.quantity;

      orderItems.push({
        product: product._id,
        title: product.title,
        variantSku,
        size,
        color,
        quantity: item.quantity,
        priceAtPurchase: unitPrice,
        price: unitPrice,
        image:
          item.image ||
          (Array.isArray(product.images) && product.images.length > 0
            ? product.images[0]
            : product.image || ""),
      });
    }

    // 4. Calculate Coupon Discounts
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

    const computedTotal =
      itemsPrice + Number(shippingPrice) + Number(taxPrice) - discountAmount;
    const finalTotalPrice = bodyTotalPrice || computedTotal;

    // 5. Create Order Document
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
      totalPrice: finalTotalPrice,
    });

    // Clear DB Cart if present
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    res.status(201).json(order);
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "fullName name email",
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin" &&
      !req.user.isAdmin
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
      .populate("user", "id fullName name email")
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
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
    order.orderStatus = "delivered";

    const updatedOrder = await order.save();
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
