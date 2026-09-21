import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  title: { 
    type: String, 
    required: true 
  },

  variantSku: { 
    type: String, 
    required: true 
  },
  size: { 
    type: String 
  },
  color: { 
    type: String 
  },
  quantity: { 
    type: Number, 
    required: true 
  },
  priceAtPurchase: { 
    type: Number, 
    required: true 
  },
  image: { 
    type: String 
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      fullName: { 
        type: String, 
        required: true 
      },

      phone: { 
        type: String, 
        required: true 
      },
      streetAddress: { 
        type: String, 
        required: true 
      },
      city: { 
        type: String, 
        required: true 
      },
      state: { 
        type: String, 
        required: true 
      },
      postalCode: { 
        type: String, 
        required: true 
      },
      country: { 
        type: String, 
        required: true 
      },
    },
    paymentMethod: { 
      type: String, 
      required: true, 
      default: "card" 
    },
    paymentResult: {
      id: String,
      status: String,
      updateTime: String,
      emailAddress: String,
    },
    coupon: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Coupon" 
    },
    itemsPrice: { 
      type: Number, 
      required: true, 
      default: 0.0 
    },
    taxPrice: { 
      type: Number, 
      required: true, 
      default: 0.0 
    },
    shippingPrice: { 
      type: Number, 
      required: true, 
      default: 0.0 
    },

    discountAmount: { 
      type: Number, 
      required: true, 
      default: 0.0 

    },

    totalPrice: { 
      type: Number, 
      required: true, 
      default: 0.0 
    },

    isPaid: { 
      type: Boolean, 
      required: true, 
      default: false 

    },

    paidAt: { 
      type: Date 
    },

    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    deliveredAt: { 
      type: Date 
    },
  },
  { timestamps: true },
);

export default mongoose.model("Order", orderSchema);
