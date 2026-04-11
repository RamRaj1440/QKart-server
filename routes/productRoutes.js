const router = require("express").Router();
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");

// Public routes
router.get("/", getProducts);
router.get("/:id", getProductById);

// Protected routes
router.post("/", protect, createProduct);
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct);


module.exports = router;