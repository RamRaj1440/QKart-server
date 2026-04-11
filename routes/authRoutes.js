const router = require("express").Router();
const { register, login, getProfile } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected route
router.get("/profile", protect, getProfile);

module.exports = router;