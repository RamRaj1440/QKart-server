const Order = require("../models/Order");
const Cart = require("../models/Cart");
const User = require("../models/User");
const razorpay = require("../utils/razorpay");
const crypto = require("crypto");

// ── Create Razorpay Order ──────────────────────────────
const createRazorpayOrder = async (req, res) => {
    try {
        console.log("Key ID:", process.env.RAZORPAY_KEY_ID);
        console.log("Secret:", process.env.RAZORPAY_KEY_SECRET ? "exists" : "missing");

        const { amount } = req.body;

        if (!amount) {
            return res.status(400).json({ message: "Amount is required" });
        }

        const options = {
            amount: amount * 100, // Convert to paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        console.error("Razorpay order error:", error.message);
        res.status(500).json({ message: "Failed to create payment order" });
    }
};

// ── Verify Payment + Place Order ───────────────────────
const verifyPaymentAndPlaceOrder = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            shippingAddress,
        } = req.body;

        // ── Verify signature ───────────────────────────────
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Payment verification failed" });
        }

        // ── Get user cart ──────────────────────────────────
        const cart = await Cart.findOne({ user: req.user._id })
            .populate("items.product", "name price image");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        // ── Calculate total ────────────────────────────────
        const totalAmount = cart.items.reduce(
            (sum, item) => sum + item.product.price * item.quantity, 0
        );

        // ── Create order ───────────────────────────────────
        const order = await Order.create({
            user: req.user._id,
            items: cart.items.map((item) => ({
                product: item.product._id,
                name: item.product.name,
                price: item.product.price,
                image: item.product.image,
                quantity: item.quantity,
            })),
            totalAmount,
            shippingAddress,
            paymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            status: "placed",
            isPaid: true,
        });

        // ── Clear cart ─────────────────────────────────────
        await Cart.findOneAndDelete({ user: req.user._id });

        res.status(201).json({
            message: "Order placed successfully",
            order,
        });
    } catch (error) {
        console.error("Verify payment error:", error.message);
        res.status(500).json({ message: "Server error placing order" });
    }
};

// ── Update Order Status (Admin) ────────────────────────
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ["placed", "processing", "shipped", "delivered", "cancelled"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // ── Emit real-time update to order room ────────────
        const io = req.app.get("io");
        io.to(order._id.toString()).emit("order_status_update", {
            orderId: order._id,
            status: order.status,
            updatedAt: order.updatedAt,
        });

        res.status(200).json({
            message: "Order status updated",
            order,
        });
    } catch (error) {
        console.error("Update order status error:", error.message);
        res.status(500).json({ message: "Server error updating order" });
    }
};

// ── Get My Orders ──────────────────────────────────────
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server error fetching orders" });
    }
};

// ── Get Single Order ───────────────────────────────────
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id,
        });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: "Server error fetching order" });
    }
};

// ── Cancel Order ───────────────────────────────────────
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Only placed or processing orders can be cancelled
        if (!["placed", "processing"].includes(order.status)) {
            return res.status(400).json({
                message: `Order cannot be cancelled. Current status: ${order.status}`,
            });
        }

        order.status = "cancelled";
        await order.save();

        // ── Refund to wallet ───────────────────────────────
        const user = await User.findById(req.user._id);
        user.balance += order.totalAmount;
        await user.save();

        // ── Emit real-time update ──────────────────────────
        const io = req.app.get("io");
        io.to(order._id.toString()).emit("order_status_update", {
            orderId: order._id,
            status: order.status,
            updatedAt: order.updatedAt,
        });

        res.status(200).json({
            message: "Order cancelled successfully",
            order,
            refundAmount: order.totalAmount,
            newBalance: user.balance,
        });
    } catch (error) {
        console.error("Cancel order error:", error.message);
        res.status(500).json({ message: "Server error cancelling order" });
    }
};

// ── Return Order ───────────────────────────────────────
const returnOrder = async (req, res) => {
    try {
        const { reason } = req.body;

        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Only delivered orders can be returned
        if (order.status !== "delivered") {
            return res.status(400).json({
                message: `Only delivered orders can be returned. Current status: ${order.status}`,
            });
        }

        order.status = "returned";
        order.returnReason = reason || "No reason provided";
        await order.save();

        // ── Refund to wallet ───────────────────────────────
        const user = await User.findById(req.user._id);
        user.balance += order.totalAmount;
        await user.save();

        // ── Emit real-time update ──────────────────────────
        const io = req.app.get("io");
        io.to(order._id.toString()).emit("order_status_update", {
            orderId: order._id,
            status: order.status,
            updatedAt: order.updatedAt,
        });

        res.status(200).json({
            message: "Return request submitted successfully",
            order,
            refundAmount: order.totalAmount,
            newBalance: user.balance,
        });
    } catch (error) {
        console.error("Return order error:", error.message);
        res.status(500).json({ message: "Server error returning order" });
    }
};

module.exports = {
    createRazorpayOrder,
    verifyPaymentAndPlaceOrder,
    updateOrderStatus,
    cancelOrder,
    returnOrder,
    getMyOrders,
    getOrderById,
};