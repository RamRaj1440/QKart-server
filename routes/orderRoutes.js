const router = require("express").Router();
const {
    createRazorpayOrder,
    verifyPaymentAndPlaceOrder,
    updateOrderStatus,
    cancelOrder,
    returnOrder,
    getMyOrders,
    getOrderById,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

// All order routes are protected
router.post("/create-razorpay-order", protect, createRazorpayOrder);
router.post("/verify-payment", protect, verifyPaymentAndPlaceOrder);
router.post("/create-payment", protect, createRazorpayOrder);
router.get("/", protect, getMyOrders);
router.get("/:id", protect, getOrderById);
router.put("/:id/status", protect, updateOrderStatus);
router.post("/:id/cancel", protect, cancelOrder);
router.post("/:id/return", protect, returnOrder);

module.exports = router;