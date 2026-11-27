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
    const donnees = z.object({
        mois: z.string().regex(/^\d{4}-\d{2}$/),
        lignesForfait: z.array(z.object({
            codeType: z.enum(["KM", "EF", "NUI", "REP"]),
            quantite: z.coerce.number().positive(),
        })).default([]),
        lignesHorsForfait: z.array(z.object({
            date: z.coerce.date(),
            libelle: z.string().trim().min(1).max(100),
            montant: z.coerce.number().positive(),
            justificatif: z.string().optional(),
        })).default([]),
    }).refine((fiche) => fiche.lignesForfait.length + fiche.lignesHorsForfait.length > 0, {
        message: "La fiche doit contenir au moins une dépense",
    }).parse(req.body);
    const fiche = await Fiche.create({ visiteur: req.user.id, ...donnees, etat: "CR",
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

exports.changerEtat = asyncHandler(async (req, res) => {
    assertId(req.params.id);
    const { etat } = z.object({
        etat: z.enum(["CR", "CL", "VA", "MP", "RB"]),
    }).parse(req.body);
    const fiche = await Fiche.findById(req.params.id);
    if (!fiche) throw new AppError("Fiche introuvable", 404);
    if (fiche.etat !== "CR" && etat === "CR") {
        throw new AppError("Une note qui a quitté l’état créée ne peut pas être rouverte", 409);
    }

    if (fiche.etat !== etat) {
        const maj = await Fiche.findOneAndUpdate(
            { _id: fiche._id, etat: fiche.etat },
            {
                $set: { etat },
                $push: { historiqueEtats: { etat, par: req.user.id } },
            },
            { new: true, runValidators: true },
        );
        if (!maj) throw new AppError("La fiche a été modifiée. Rechargez-la puis réessayez.", 409);
        return res.json(maj);
    }

    res.json(fiche);
});

exports.supprimer = asyncHandler(async (req, res) => {
    assertId(req.params.id);
    const fiche = await Fiche.findById(req.params.id);
    if (!fiche) throw new AppError("Fiche introuvable", 404);
    if (String(fiche.visiteur) !== req.user.id) throw new AppError("Accès refusé", 403);
    if (fiche.etat !== "CR") {
        throw new AppError("Seule une fiche créée peut être supprimée", 409);
    }

    const supprimee = await Fiche.findOneAndDelete({
        _id: fiche._id,
        visiteur: req.user.id,
        etat: "CR",
    });
    if (!supprimee) throw new AppError("La fiche ne peut plus être supprimée", 409);
    res.status(204).end();
});
