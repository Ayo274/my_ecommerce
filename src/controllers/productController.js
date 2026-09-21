import Product from "../models/product.js";

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
};

export const createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      brand,
      basePrice,
      discountPercentage,
      isFeatured,
    } = req.body;

    const imageUrls =
      req.files && req.files.length > 0
        ? req.files.map((file) => file.path)
        : req.body.images
          ? JSON.parse(req.body.images)
          : [];

    let parsedVariants = [];
    if (req.body.variants) {
      parsedVariants =
        typeof req.body.variants === "string"
          ? JSON.parse(req.body.variants)
          : req.body.variants;
    }

    const slug = slugify(title, { lower: true });

    const product = await Product.create({
      title,
      slug,
      description,
      category,
      brand: brand || null,
      basePrice: Number(basePrice),
      discountPercentage: Number(discountPercentage) || 0,
      images: imageUrls,
      variants: parsedVariants,
      isFeatured: isFeatured === "true" || isFeatured === true,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { keyword, category, minPrice, maxPrice } = req.query;

    let query = {};

    if (keyword) {
      query.title = { $regex: keyword, $options: "i" };
    }

    if (category) {
      query.category = category;
    }
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = Number(minPrice);
      if (maxPrice) query.basePrice.$lte = Number(maxPrice);
    }

    const products = await Product.find(query)
      .populate("category", "name slug");
      // .populate("brand", "name");

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name slug")
      // .populate("brand", "name");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (req.body.title) {
      product.title = req.body.title;
      product.slug = slugify(req.body.title);
    }

    product.description = req.body.description ?? product.description;
    product.category = req.body.category ?? product.category;
    product.brand = req.body.brand ?? product.brand;
    product.basePrice = req.body.basePrice ?? product.basePrice;
    product.discountPercentage =
      req.body.discountPercentage ?? product.discountPercentage;
    product.images = req.body.images ?? product.images;
    product.variants = req.body.variants ?? product.variants;
    product.isFeatured = req.body.isFeatured ?? product.isFeatured;

    const updatedProduct = await product.save();
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.deleteOne();
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString(),
    );

    if (alreadyReviewed) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this product" });
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;

    // Calculate average rating
    product.averageRating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: "Review added successfully", product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
