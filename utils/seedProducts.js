const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("../models/Product");

dotenv.config();

const products = [
    {
        name: "Apple iPhone 14 Pro Max 256GB",
        category: "Electronics",
        price: 129999,
        rating: 4.8,
        reviews: 2341,
        image: "/images/iphone.jpg",
        description: "Latest iPhone with A16 Bionic chip and Dynamic Island.",
        stock: 50,
    },
    {
        name: "Samsung 65 inch 4K Smart TV",
        category: "Electronics",
        price: 79999,
        rating: 4.6,
        reviews: 1203,
        image: "/images/samsung-tv.jpg",
        description: "Crystal clear 4K display with smart features.",
        stock: 30,
    },
    {
        name: "Nike Air Max 270 Running Shoes",
        category: "Footwear",
        price: 12999,
        rating: 4.5,
        reviews: 876,
        image: "/images/nike-shoes.jpg",
        description: "Comfortable running shoes with Air Max cushioning.",
        stock: 100,
    },
    {
        name: "Sony WH-1000XM5 Wireless Headphones",
        category: "Electronics",
        price: 29999,
        rating: 4.9,
        reviews: 3120,
        image: "/images/headphones.jpg",
        description: "Industry leading noise cancellation headphones.",
        stock: 75,
    },
    {
        name: "Levi's Men's Slim Fit Jeans",
        category: "Clothing",
        price: 3499,
        rating: 4.3,
        reviews: 654,
        image: "/images/jeans.jpg",
        description: "Classic slim fit jeans for everyday wear.",
        stock: 200,
    },
    {
        name: "Instant Pot Duo 7-in-1 Pressure Cooker",
        category: "Kitchen",
        price: 8999,
        rating: 4.7,
        reviews: 4321,
        image: "/images/pressure-cooker.jpg",
        description: "Multi-use pressure cooker for fast healthy meals.",
        stock: 60,
    },
    {
        name: "MacBook Air M2 8GB 256GB",
        category: "Electronics",
        price: 114900,
        rating: 4.9,
        reviews: 1876,
        image: "/images/macbook.jpg",
        description: "Supercharged by M2 chip with all day battery life.",
        stock: 40,
    },
    {
        name: "Yoga Mat Anti-Slip with Carry Bag",
        category: "Sports",
        price: 1299,
        rating: 4.4,
        reviews: 987,
        image: "/images/yoga-mat.jpg",
        description: "Premium anti-slip yoga mat for all exercises.",
        stock: 150,
    },
];

const seedProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(" MongoDB Connected");
        await Product.deleteMany();
        console.log("  Existing products cleared");
        await Product.insertMany(products);
        console.log(` ${products.length} products seeded successfully`);
        process.exit(0);
    } catch (error) {
        console.error(" Seed error:", error.message);
        process.exit(1);
    }
};

seedProducts();