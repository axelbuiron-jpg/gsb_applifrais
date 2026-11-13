const Tesseract = require("tesseract.js");
const Fiche = require("../models/fiche.model");
const { televerser } = require("../services/stockage");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
function extraireMontant(t) {
    const m = t.match(/\d+[.,]\d{2}/g);
    return m ? Math.max(...m.map((s) => parseFloat(s.replace(",", ".")))) : null;
}

// POST /fiches/:id/analyse — stocke la photo sur S3, PROPOSE un frais (n'enregistre rien)
exports.analyser = asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError("Aucune image reçue", 400);
    const fiche = await Fiche.findById(req.params.id);
    if (!fiche || String(fiche.visiteur) !== req.user.id) throw new AppError("Accès refusé", 403);
    const cle = await televerser(req.file.buffer, req.file.mimetype); // 1. sur S3
    const { data } = await Tesseract.recognize(req.file.buffer, "fra"); // 2. OCR
    res.json({ proposition: { montant: extraireMontant(data.text), // 3. proposer
        justificatif: cle }, confiance: Math.round(data.confidence) });
});

exports.justificatif = asyncHandler(async (req, res) => {
    const fiche = await Fiche.findById(req.params.id);
    if (!fiche) throw new AppError("Fiche introuvable", 404);
    const aLeDroit = String(fiche.visiteur) === req.user.id || req.user.role === "comptable";
    if (!aLeDroit) throw new AppError("Accès refusé", 403);
    if (!fiche.lignesHorsForfait.some((l) => l.justificatif === req.query.cle))
        throw new AppError("Justificatif introuvable", 404); // la clé doit être SUR cette fiche
    res.json({ url: await lienTemporaire(req.query.cle) });
});
