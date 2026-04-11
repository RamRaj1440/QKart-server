const Cart = require("../models/Cart");
const Product = require("../models/Product");

// ── Get Cart ───────────────────────────────────────────
const getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id })
            .populate("items.product", "name price image category");

        if (!cart) {
            return res.status(200).json({ items: [], total: 0 });
        }

        res.status(200).json(cart);
    } catch (error) {
        console.error("Get cart error:", error.message);
        res.status(500).json({ message: "Server error fetching cart" });
    }
};

// ── Add to Cart ────────────────────────────────────────
const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || !quantity) {
            return res.status(400).json({ message: "Product ID and quantity are required" });
        }

        // Check product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            // Create new cart
            cart = await Cart.create({
                user: req.user._id,
                items: [{ product: productId, quantity }],
            });
        } else {
            // Check if product already in cart
            const existingItem = cart.items.find(
                (item) => item.product.toString() === productId
            );

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.items.push({ product: productId, quantity });
            }

            await cart.save();
        }

        // Return populated cart
        await cart.populate("items.product", "name price image category");
        res.status(200).json({ message: "Added to cart", cart });
    } catch (error) {
        console.error("Add to cart error:", error.message);
        res.status(500).json({ message: "Server error adding to cart" });
    }
};

// ── Update Cart Item Quantity ──────────────────────────
const updateCartItem = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (quantity < 1) {
            return res.status(400).json({ message: "Quantity must be at least 1" });
        }

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        const item = cart.items.find(
            (item) => item.product.toString() === productId
        );

        if (!item) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        item.quantity = quantity;
        await cart.save();
        await cart.populate("items.product", "name price image category");

        res.status(200).json({ message: "Cart updated", cart });
    } catch (error) {
        console.error("Update cart error:", error.message);
        res.status(500).json({ message: "Server error updating cart" });
    }
};

// ── Remove from Cart ───────────────────────────────────
const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        cart.items = cart.items.filter(
            (item) => item.product.toString() !== productId
        );

        await cart.save();
        await cart.populate("items.product", "name price image category");

        res.status(200).json({ message: "Item removed", cart });
    } catch (error) {
        console.error("Remove from cart error:", error.message);
        res.status(500).json({ message: "Server error removing item" });
    }
};

// ── Clear Cart ─────────────────────────────────────────
const clearCart = async (req, res) => {
    try {
        await Cart.findOneAndDelete({ user: req.user._id });
        res.status(200).json({ message: "Cart cleared" });
    } catch (error) {
        console.error("Clear cart error:", error.message);
        res.status(500).json({ message: "Server error clearing cart" });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
};