const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    },
    name: String,
    price: Number,
    image: String,
    quantity: Number,
});

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        items: [orderItemSchema],
        totalAmount: {
            type: Number,
            required: true,
        },
        shippingAddress: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            pincode: { type: String, required: true },
        },
        status: {
            type: String,
            enum: ["placed", "processing", "shipped", "delivered", "cancelled"],
            default: "placed",
        },
        isPaid: {
            type: Boolean,
            default: false,
        },
        paymentId: {
            type: String,
            default: "",
        },
        razorpayOrderId: {
            type: String,
            default: "",
        },
    },

    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);