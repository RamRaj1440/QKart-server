const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");

// ── Get Dashboard Stats ────────────────────────────────
const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ isAdmin: { $ne: true } });
        const totalOrders = await Order.countDocuments();
        const totalProducts = await Product.countDocuments();

        const orders = await Order.find();
        const totalRevenue = orders
            .filter((o) => o.isPaid)
            .reduce((sum, o) => sum + o.totalAmount, 0);

        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("user", "username email");

        const ordersByStatus = {
            placed: await Order.countDocuments({ status: "placed" }),
            processing: await Order.countDocuments({ status: "processing" }),
            shipped: await Order.countDocuments({ status: "shipped" }),
            delivered: await Order.countDocuments({ status: "delivered" }),
            cancelled: await Order.countDocuments({ status: "cancelled" }),
            returned: await Order.countDocuments({ status: "returned" }),
        };

        res.status(200).json({
            totalUsers,
            totalOrders,
            totalProducts,
            totalRevenue,
            recentOrders,
            ordersByStatus,
        });
    } catch (error) {
        console.error("Dashboard stats error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// ── Get All Users ──────────────────────────────────────
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ isAdmin: false }).select("-password");
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// ── Get All Orders ─────────────────────────────────────
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate("user", "username email");
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// ── Update Order Status ────────────────────────────────
const adminUpdateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = [
            "placed", "processing", "shipped",
            "delivered", "cancelled", "returned",
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate("user", "username email");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Emit real-time update
        const io = req.app.get("io");
        io.to(order._id.toString()).emit("order_status_update", {
            orderId: order._id,
            status: order.status,
            updatedAt: order.updatedAt,
        });

        res.status(200).json({ message: "Order status updated", order });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// ── Delete User ────────────────────────────────────────
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.isAdmin) {
            return res.status(400).json({ message: "Cannot delete admin user" });
        }
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// ── Add Product ────────────────────────────────────────
const addProduct = async (req, res) => {
    try {
        const { name, category, price, image, description, stock, rating, reviews } = req.body;

        if (!name || !category || !price || !image) {
            return res.status(400).json({ message: "Name, category, price and image are required" });
        }

        const product = await Product.create({
            name, category, price, image,
            description, stock,
            rating: rating || 0,
            reviews: reviews || 0,
        });

        res.status(201).json({ message: "Product added", product });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
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
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getDashboardStats,
    getAllUsers,
    getAllOrders,
    adminUpdateOrderStatus,
    deleteUser,
    addProduct,
    deleteProduct,
};