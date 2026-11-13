const mongoose = require("mongoose");
const bareme = require("../config/bareme");

const ligneForfaitSchema = new mongoose.Schema({
    codeType: { type: String, enum: ["KM", "EF", "NUI", "REP"], required: true },
    quantite: { type: Number, required: true, min: 0 },
}, { _id: false });

const ligneHorsForfaitSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    libelle: { type: String, required: true, maxlength: 100 },
    montant: { type: Number, required: true, min: 0 },
    justificatif: { type: String }, // clé du reçu dans le stockage S3
});

const evenementSchema = new mongoose.Schema({
    etat: { type: String, enum: ["CR", "CL", "VA", "MP", "RB"], required: true },
    par: { type: mongoose.Schema.Types.ObjectId, ref: "Visiteur" },
    date: { type: Date, default: Date.now },
}, { _id: false });

const ficheSchema = new mongoose.Schema({
    visiteur: { type: mongoose.Schema.Types.ObjectId, ref: "Visiteur", required: true },
    mois: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    etat: { type: String, enum: ["CR", "CL", "VA", "MP", "RB"], default: "CR" },
    lignesForfait: [ligneForfaitSchema],
    lignesHorsForfait: [ligneHorsForfaitSchema],
    historiqueEtats: [evenementSchema],
    schemaVersion: { type: Number, default: 1 },
}, { timestamps: true, toJSON: { virtuals: true } });

ficheSchema.index({ visiteur: 1, mois: 1 }, { unique: true });
ficheSchema.index({ etat: 1 });

ficheSchema.virtual("total").get(function () {
    const forfait = (this.lignesForfait || []).reduce(
        (s, l) => s + l.quantite * bareme.montant(l.codeType), 0);
    const hors = (this.lignesHorsForfait || []).reduce((s, l) => s + l.montant, 0);
    return Math.round((forfait + hors) * 100) / 100;
});