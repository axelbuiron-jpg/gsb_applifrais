const mongoose = require("mongoose");
let connexionEnCours;

async function connectDB() {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI manquant");
    }

    if (mongoose.connection.readyState === 1) return;

    if (!connexionEnCours) {
        connexionEnCours = mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        })
            .then(() => console.log("MongoDB connecté"))
            .finally(() => {
                connexionEnCours = null;
            });
    }

    await connexionEnCours;
}

module.exports = connectDB;
