const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
        },
        category: {
            type: String,
            required: [true, "Category is required"],
            trim: true,
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"],
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        reviews: {
            type: Number,
            default: 0,
        },
        image: {
            type: String,
            required: [true, "Image URL is required"],
        },
        description: {
            type: String,
            default: "",
        },
        stock: {
            type: Number,
            default: 100,
            min: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);