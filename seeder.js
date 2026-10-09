import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import Product from "./src/models/product.js";
import Category from "./src/models/category.js"; // Adjust path if category model exists
import connectDB from "./src/config/db.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();
connectDB();

const sampleProducts = [
  // Flash Sales Products (Items 1-4)
  {
    title: "HAVIT HV-G92 Gamepad",
    slug: "havit-hv-g92-gamepad",
    description:
      "Ergonomic wired USB gaming controller featuring dual vibration rumble feedback.",
    price: 120,
    basePrice: 120,
    originalPrice: 160,
    discountPercentage: 40,
    numReviews: 88,
    averageRating: 5,
    rating: 5,
    reviews: [],
    image:
      "https://res.cloudinary.com/nxzkqvbj/image/upload/v1791342986/ecommerce-products/p9phojrdlf5pqvekqtjf.png",
    images: [
      "https://res.cloudinary.com/nxzkqvbj/image/upload/v1791342986/ecommerce-products/p9phojrdlf5pqvekqtjf.png",
    ],
    countInStock: 15,
  },
  {
    title: "AK -900 wired keyboard",
    slug: "ak-900-wired-keyboard",
    description:
      "Full-size RGB backlit mechanical feel gaming keyboard with anti-ghosting keys.",
    price: 960,
    basePrice: 960,
    originalPrice: 1160,
    discountPercentage: 35,
    numReviews: 75,
    averageRating: 4,
    rating: 4,
    reviews: [],
    image:
      "https://res.cloudinary.com/nxzkqvbj/image/upload/v1791342986/ecommerce-products/xcnsbhusepe9ykihdgwj.png",
    images: [
      "https://res.cloudinary.com/nxzkqvbj/image/upload/v1791342986/ecommerce-products/xcnsbhusepe9ykihdgwj.png",
    ],
    isNewProduct: true,
    countInStock: 8,
  },
  {
    title: "IPS LCD Gaming Monitor",
    slug: "ips-lcd-gaming-monitor",
    description:
      "27-inch Full HD IPS gaming monitor with ultra-fast 144Hz refresh rate.",
    price: 370,
    basePrice: 370,
    originalPrice: 400,
    discountPercentage: 30,
    numReviews: 99,
    averageRating: 5,
    rating: 5,
    reviews: [],
    image:
      "https://res.cloudinary.com/nxzkqvbj/image/upload/v1791342986/ecommerce-products/ghw01lj5z6nvwqfri3gf.png",
    images: [
      "https://res.cloudinary.com/nxzkqvbj/image/upload/v1791342986/ecommerce-products/ghw01lj5z6nvwqfri3gf.png",
    ],
    countInStock: 5,
  },
  {
    title: "S-Series Comfort Chair",
    slug: "s-series-comfort-chair",
    description:
      "High-back ergonomic executive gaming and desk chair with lumbar support.",
    price: 375,
    basePrice: 375,
    originalPrice: 400,
    discountPercentage: 25,
    numReviews: 99,
    averageRating: 4.5,
    rating: 4.5,
    reviews: [],
    image:
      "https://res.cloudinary.com/nxzkqvbj/image/upload/v1791342986/ecommerce-products/cwdqtnnaezgcdlsed5u3.png",
    images: [
      "https://res.cloudinary.com/nxzkqvbj/image/upload/v1791342986/ecommerce-products/cwdqtnnaezgcdlsed5u3.png",
    ],
    countInStock: 20,
  },

  // Best Selling Products (Items 5-8)
  {
    title: "The north coat",
    slug: "the-north-coat",
    description:
      "All-weather insulated winter jacket designed for extreme outdoor conditions.",
    price: 260,
    basePrice: 260,
    originalPrice: 360,
    discountPercentage: 0,
    numReviews: 65,
    averageRating: 5,
    rating: 5,
    reviews: [],
    image:
      "https://res.cloudinary.com/nxzkqvbj/image/upload/v1791342986/ecommerce-products/r2qs8mgiveddakkenpf5.png",
    images: [
      "https://res.cloudinary.com/nxzkqvbj/image/upload/v1791342986/ecommerce-products/r2qs8mgiveddakkenpf5.png",
    ],
    countInStock: 4,
  },
  {
    title: "Gucci duffle bag",
    slug: "gucci-duffle-bag",
    description:
      "Luxury travel duffle bag crafted with premium canvas and leather detailing.",
    price: 960,
    basePrice: 960,
    originalPrice: 1160,
    discountPercentage: 0,
    numReviews: 65,
    averageRating: 4.5,
    rating: 4.5,
    reviews: [],
    image:
      "https://res.cloudinary.com/nxzkqvbj/image/upload/v1791342986/ecommerce-products/zxpze2pjie4gehyrw9mu.png",
    images: [
      "https://res.cloudinary.com/nxzkqvbj/image/upload/v1791342986/ecommerce-products/zxpze2pjie4gehyrw9mu.png",
    ],
    countInStock: 12,
  },
  {
    title: "RGB liquid CPU Cooler",
    slug: "rgb-liquid-cpu-cooler",
    description:
      "All-in-one liquid CPU cooler with customizable RGB lighting and dual fans.",
    price: 160,
    basePrice: 160,
    originalPrice: 170,
    discountPercentage: 0,
    numReviews: 65,
    averageRating: 4.5,
    rating: 4.5,
    reviews: [],
    image:
      "https://res.cloudinary.com/nxzkqvbj/image/upload/v1791342986/ecommerce-products/cksgbqijgkypwzhktthm.png",
    images: [
      "https://res.cloudinary.com/nxzkqvbj/image/upload/v1791342986/ecommerce-products/cksgbqijgkypwzhktthm.png",
    ],
    countInStock: 10,
  },
  {
    title: "Small BookSelf",
    slug: "small-bookself",
    description:
      "Compact multi-tier wooden bookshelf suitable for modern home office spaces.",
    price: 360,
    basePrice: 360,
    originalPrice: 360,
    discountPercentage: 0,
    numReviews: 65,
    averageRating: 5,
    rating: 5,
    reviews: [],
    image:
      "https://res.cloudinary.com/nxzkqvbj/image/upload/v1791342986/ecommerce-products/xlgs1vlcm0citsibsjwj.png",
    images: [
      "https://res.cloudinary.com/nxzkqvbj/image/upload/v1791342986/ecommerce-products/xlgs1vlcm0citsibsjwj.png",
    ],
    countInStock: 6,
  },
];

const importData = async () => {
  try {
    // 1. Clear existing products
    await Product.deleteMany();

    // 2. Assign valid category reference if required by Mongoose
    let categoryId = new mongoose.Types.ObjectId("64f1a2b3c4d5e6f7a8b9c0d1");
    if (Category) {
      let cat = await Category.findOne();
      if (!cat) {
        cat = await Category.create({
          name: "Electronics",
          slug: "electronics",
        });
      }
      categoryId = cat._id;
    }

    const productsToInsert = sampleProducts.map((p) => ({
      ...p,
      category: categoryId,
    }));

    // 3. Insert products
    const inserted = await Product.insertMany(productsToInsert);
    console.log(
      `Successfully seeded ${inserted.length} products into MongoDB!`,
    );
    process.exit();
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

importData();
