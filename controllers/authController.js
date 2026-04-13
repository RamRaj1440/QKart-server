const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// ── Register ───────────────────────────────────────────
const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const user = await User.create({ username, email, password });

        res.status(201).json({
            message: "Registration successful",
            _id: user._id,
            username: user.username,
            email: user.email,
            balance: user.balance,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error("Register error:", error.message);
        res.status(500).json({ message: "Server error during registration" });
    }
};


// ── Login ──────────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        res.status(200).json({
            message: "Login successful",
            _id: user._id,
            username: user.username,
            email: user.email,
            balance: user.balance,
            isAdmin: user.isAdmin,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({ message: "Server error during login" });
    }
};

// ── Get Profile ────────────────────────────────────────
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }

};

// ── Update Profile ─────────────────────────────────────
const updateProfile = async (req, res) => {
    try {
        const { username, email, currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ── Update username ────────────────────────────────
        if (username) user.username = username;

        // ── Update email ───────────────────────────────────
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: "Email already in use" });
            }
            user.email = email;
        }

        // ── Update password ────────────────────────────────
        if (currentPassword && newPassword) {
            const isMatch = await user.matchPassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({ message: "Current password is incorrect" });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ message: "New password must be at least 6 characters" });
            }
            user.password = newPassword;
        }

        await user.save();

        res.status(200).json({
            message: "Profile updated successfully",
            _id: user._id,
            username: user.username,
            email: user.email,
            balance: user.balance,
            isAdmin: user.isAdmin,
            token: req.headers.authorization.split(" ")[1],
        });
    } catch (error) {
        console.error("Update profile error:", error.message);
        res.status(500).json({ message: "Server error updating profile" });
    }
};


module.exports = { register, login, getProfile, updateProfile };