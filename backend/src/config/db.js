const mongoose = require("mongoose");

async function connectDB() {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI manquant");
    }

    await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connecté");
}

module.exports = connectDB;
