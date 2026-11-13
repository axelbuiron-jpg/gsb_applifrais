const mongoose = require("mongoose");
const { z } = require("zod");
const Fiche = require("../models/fiche.model");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

function assertId(id) {
    if (!mongoose.isValidObjectId(id)) throw new AppError("Identifiant invalide", 400);
}

function ensureOwnership(req, fiche) {
    const visiteurId = fiche.visiteur && typeof fiche.visiteur === "object"
        ? String(fiche.visiteur._id || fiche.visiteur)
        : String(fiche.visiteur);

    if (req.user.role !== "comptable" && visiteurId !== req.user.id) {
        throw new AppError("Accès refusé", 403);
    }
}

exports.lister = asyncHandler(async (req, res) => {
    const filtre = req.user.role === "comptable" ? {} : { visiteur: req.user.id };
    const fiches = await Fiche.find(filtre).populate("visiteur", "nom prenom").sort({ mois: -1 });
    res.json(fiches);
});

// GET /fiches/:id — contrôle de propriété (anti-IDOR)
exports.lire = asyncHandler(async (req, res) => {
    assertId(req.params.id);
    const fiche = await Fiche.findById(req.params.id).populate("visiteur", "nom prenom");
    if (!fiche) throw new AppError("Fiche introuvable", 404);
    ensureOwnership(req, fiche);
    res.json(fiche);
});

// POST /fiches — le visiteur crée SA fiche du mois
exports.creer = asyncHandler(async (req, res) => {
    const { mois } = z.object({ mois: z.string().regex(/^\d{4}-\d{2}$/) }).parse(req.body);
    const fiche = await Fiche.create({ visiteur: req.user.id, mois, etat: "CR",
        historiqueEtats: [{ etat: "CR", par: req.user.id }] });
    res.status(201).json(fiche);
});

// POST /fiches/:id/lignes — ajouter un frais hors forfait
exports.ajouterLigne = asyncHandler(async (req, res) => {
    assertId(req.params.id);
    const ligne = z.object({ date: z.coerce.date(), libelle: z.string().min(1).max(100),
        montant: z.coerce.number().positive(), justificatif: z.string().optional() }).parse(req.body);
    const fiche = await Fiche.findById(req.params.id);
    if (!fiche) throw new AppError("Fiche introuvable", 404);
    ensureOwnership(req, fiche);
    if (fiche.etat !== "CR") throw new AppError("Fiche non modifiable", 409);
    fiche.lignesHorsForfait.push(ligne);
    await fiche.save();
    res.status(201).json(fiche);
});

exports.cloturer = asyncHandler(async (req, res) => {
    assertId(req.params.id); // ① l'id a-t-il la bonne forme ?
    const fiche = await Fiche.findById(req.params.id);
    if (!fiche) throw new AppError("Fiche introuvable", 404);
    if (String(fiche.visiteur) !== req.user.id) // ② est-ce bien SA fiche ?
        throw new AppError("Accès refusé", 403);
    if (fiche.etat !== "CR") // ③ l'état permet-il l'action ?
        throw new AppError("Seule une fiche créée peut être clôturée", 409);
    fiche.etat = "CL";
    fiche.historiqueEtats.push({ etat: "CL", par: req.user.id });
    await fiche.save();
    res.json(fiche);
});

exports.valider = asyncHandler(async (req, res) => {
    assertId(req.params.id);
    const fiche = await Fiche.findById(req.params.id);
    if (!fiche) throw new AppError("Fiche introuvable", 404);
    if (fiche.etat !== "CL") throw new AppError("Fiche non validable", 409);

    fiche.etat = "VA";
    fiche.historiqueEtats.push({ etat: "VA", par: req.user.id });
    await fiche.save();
    res.json(fiche);
});
