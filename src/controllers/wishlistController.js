import Wishlist from "../models/Wishlist.js";
import Product from "../models/product.js";

export const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
      path: "products",
      select: "title slug basePrice discountPercentage images averageRating",
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    res.status(200).json(wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    const isExisting = wishlist.products.includes(productId);

    if (isExisting) {
      wishlist.products = wishlist.products.filter(
        (id) => id.toString() !== productId,
      );
    } else {
      wishlist.products.push(productId);
    }
    await wishlist.save();

    const updatedWishlist = await Wishlist.findById(wishlist._id).populate({
      path: "products",
      select: "title slug basePrice discountPercentage images averageRating",
    });

    res.status(200).json({
      message: isExisting ? "Removed from wishlist" : "Added to wishlist",
      wishlist: updatedWishlist,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    wishlist.products = wishlist.products.filter(
      (id) => id.toString() !== productId,
    );

    await wishlist.save();

    const updatedWishlist = await Wishlist.findById(wishlist._id).populate({
      path: "products",
      select: "title slug basePrice discountPercentage images averageRating",
    });

    res.status(200).json(updatedWishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
