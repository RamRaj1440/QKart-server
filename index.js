const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// ── Socket.io Setup ────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// ── Make io accessible in controllers ─────────────────
app.set("io", io);

// ── Socket Events ──────────────────────────────────────
io.on("connection", (socket) => {
    console.log(` Client connected: ${socket.id}`);

    // Join room by orderId
    socket.on("join_order", (orderId) => {
        socket.join(orderId);
        console.log(` Client joined order room: ${orderId}`);
    });

    socket.on("disconnect", () => {
        console.log(` Client disconnected: ${socket.id}`);
    });
});

// ── Middleware ─────────────────────────────────────────
app.use(cors({
    origin: "*",
    credentials: true,
}));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────
app.use("/api/v1/auth", require("./routes/authRoutes"));
app.use("/api/v1/products", require("./routes/productRoutes"));
app.use("/api/v1/cart", require("./routes/cartRoutes"));
app.use("/api/v1/orders", require("./routes/orderRoutes"));
app.use("/api/v1/admin", require("./routes/adminRoutes"));

// ── Health Check ───────────────────────────────────────
app.get("/api/v1", (req, res) => {
    res.json({ message: "QKart API is running " });
});

// ── 404 Handler ────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// ── Global Error Handler ───────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal server error" });
});

// ── Start Server ───────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
});