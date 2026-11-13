const mongoose = require("mongoose");

const visiteurSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    motDePasseHash: { type: String, required: true },
    role: { type: String, enum: ["visiteur", "comptable"], default: "visiteur" },
    ville: { type: String },
}, { timestamps: true });
module.exports = mongoose.model("Visiteur", visiteurSchema);