const mongoose = require("mongoose");

const typeFraisSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true }, // "KM","EF","NUI","REP"
    libelle: { type: String, required: true },
    montant: { type: Number, required: true, min: 0 }, // € par unité
    unite: { type: String },
    actif: { type: Boolean, default: true },
    dateDebut: { type: Date, default: Date.now },
}, { timestamps: true });
module.exports = mongoose.model("TypeFrais", typeFraisSchema, "typesFrais");