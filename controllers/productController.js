const Product = require("../models/Product");

// ── Get All Products ───────────────────────────────────
const getProducts = async (req, res) => {
    try {
        const { search, category } = req.query;

        // Build filter object
        const filter = {};
        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }
        if (category) {
            filter.category = category;
        }

        const products = await Product.find(filter);
        res.status(200).json(products);
    } catch (error) {
        console.error("Get products error:", error.message);
        res.status(500).json({ message: "Server error fetching products" });
    }
};

// ── Get Single Product ─────────────────────────────────
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error("Get product error:", error.message);
        res.status(500).json({ message: "Server error fetching product" });
    }
};

// ── Create Product ─────────────────────────────────────
const createProduct = async (req, res) => {
    try {
        const { name, category, price, rating, reviews, image, description, stock } = req.body;

        if (!name || !category || !price || !image) {
            return res.status(400).json({ message: "Name, category, price and image are required" });
        }

        const product = await Product.create({
            name, category, price,
            rating: rating || 0,
            reviews: reviews || 0,
            image, description, stock,
        });

        res.status(201).json({ message: "Product created", product });
    } catch (error) {
        console.error("Create product error:", error.message);
        res.status(500).json({ message: "Server error creating product" });
    }
};

// ── Update Product ─────────────────────────────────────
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json({ message: "Product updated", product });
    } catch (error) {
        console.error("Update product error:", error.message);
        res.status(500).json({ message: "Server error updating product" });
    }
};

// ── Delete Product ─────────────────────────────────────
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json({ message: "Product deleted" });
    } catch (error) {
        console.error("Delete product error:", error.message);
        res.status(500).json({ message: "Server error deleting product" });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};