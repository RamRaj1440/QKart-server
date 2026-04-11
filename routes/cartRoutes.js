const router = require("express").Router();
const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
} = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");

// All cart routes are protected
router.get("/", protect, getCart);
router.post("/", protect, addToCart);
router.put("/", protect, updateCartItem);
router.delete("/clear", protect, clearCart);
router.delete("/:productId", protect, removeFromCart);

module.exports = router;