import Order from "../models/order.js";
import Product from "../models/product.js";
import User from "../models/user.js";

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();

    const revenueData = await Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
          paidOrdersCount: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue =
      revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
    const paidOrdersCount =
      revenueData.length > 0 ? revenueData[0].paidOrdersCount : 0;

    // 3. Orders Breakdown by Status (e.g., Pending, Processing, Delivered)
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // 4. Monthly Revenue & Order Sales Trend (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          isPaid: true,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // 5. Recent 5 Orders for Dashboard Table
    const recentOrders = await Order.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      summary: {
        totalRevenue,
        totalOrders,
        paidOrdersCount,
        totalProducts,
        totalUsers,
      },
      ordersByStatus,
      monthlySales,
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
