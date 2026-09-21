import slugify from "slugify";
import Category from "../models/category.js";

export const createCategory = async (req, res) => {
  try {
    const { name, description, parentCategory } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }
    const imageUrl = req.file ? req.file.path : null;

    const slug = slugify(name, { lower: true });

    const category = await Category.create({
      name,
      slug,
      description,
      parentCategory: parentCategory || null,
      image: imageUrl,
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate(
      "parentCategory",
      "name slug",
    );
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate(
      "parentCategory",
      "name slug",
    );
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name, parentCategory, imageUrl } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (name) {
      category.name = name;
      category.slug = slugify(name);
    }
    if (parentCategory !== undefined)
      category.parentCategory = parentCategory || null;
    if (imageUrl !== undefined) category.imageUrl = imageUrl;

    const updatedCategory = await category.save();
    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await category.deleteOne();
    res.status(200).json({ message: "Category removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
