import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const router = express.Router();

// 1. Cloudinary configuration using environment variables (.env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Storage engine setup for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "ecommerce-products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({ storage });

// 3. Single image upload endpoint (POST /api/upload)
router.post("/", (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    res.status(200).json({
      message: "Image uploaded successfully",
      imageUrl: req.file.path,
    });
  });
});

// 4. Multiple image upload endpoint (POST /api/upload/multiple - max 20 images)
router.post("/multiple", (req, res) => {
  upload.array("images", 20)(req, res, (err) => {
    if (err) {
      // Catches errors like selecting too many files
      return res.status(400).json({ message: err.message });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No image files provided" });
    }

    const imageUrls = req.files.map((file) => file.path);
    res.status(200).json({
      message: "Images uploaded successfully",
      imageUrls: imageUrls,
    });
  });
});

export default router;
