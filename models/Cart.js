const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, "Quantity must be at least 1"],
        default: 1,
    },
});

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        items: [cartItemSchema],
    },
    { timestamps: true }
);

// ── Calculate total virtual field ──────────────────────
cartSchema.virtual("total").get(function () {
    return this.items.reduce((sum, item) => {
        if (item.product && item.product.price) {
            return sum + item.product.price * item.quantity;
        }
        return sum;
    }, 0);
});

module.exports = mongoose.model("Cart", cartSchema);