const router = require("express").Router();
const {
    getDashboardStats,
    getAllUsers,
    getAllOrders,
    adminUpdateOrderStatus,
    deleteUser,
    addProduct,
    deleteProduct,
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

// All routes protected + admin only
router.get("/stats", protect, adminOnly, getDashboardStats);
router.get("/users", protect, adminOnly, getAllUsers);
router.get("/orders", protect, adminOnly, getAllOrders);
router.put("/orders/:id/status", protect, adminOnly, adminUpdateOrderStatus);
router.delete("/users/:id", protect, adminOnly, deleteUser);
router.post("/products", protect, adminOnly, addProduct);
router.delete("/products/:id", protect, adminOnly, deleteProduct);

module.exports = router;