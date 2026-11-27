const mongoose = require("mongoose");
const Fiche = require("../models/fiche.model");
const Visiteur = require("../models/visiteur.model");
const bareme = require("../config/bareme");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const TYPES_FRAIS = [
    { code: "KM", libelle: "Kilométrage (KM)" },
    { code: "EF", libelle: "Frais forfaitaires (EF)" },
    { code: "NUI", libelle: "Nuitées (NUI)" },
    { code: "REP", libelle: "Repas (REP)" },
    { code: "HF", libelle: "Frais hors forfait" },
];

const ETATS = [
    { code: "CR", libelle: "Créée" },
    { code: "CL", libelle: "Clôturée" },
    { code: "VA", libelle: "Validée" },
    { code: "MP", libelle: "Mise en paiement" },
    { code: "RB", libelle: "Remboursée" },
];

function lireFiltres(query) {
    const { mois = "", visiteur = "", etat = "" } = query;

    if (typeof mois !== "string"
        || (mois && !/^\d{4}-(0[1-9]|1[0-2])$/.test(mois))) {
        throw new AppError("Le mois doit être au format AAAA-MM", 400);
    }
    if (typeof visiteur !== "string"
        || (visiteur && !mongoose.isValidObjectId(visiteur))) {
        throw new AppError("Le visiteur sélectionné est invalide", 400);
    }
    if (typeof etat !== "string"
        || (etat && !ETATS.some((option) => option.code === etat))) {
        throw new AppError("Le statut sélectionné est invalide", 400);
    }

    const filtres = {};
    if (mois) filtres.mois = mois;
    if (visiteur) filtres.visiteur = visiteur;
    if (etat) filtres.etat = etat;

    return { filtres, selection: { mois, visiteur, etat } };
}

exports.lire = asyncHandler(async (req, res) => {
    const { filtres, selection } = lireFiltres(req.query);
    const [fiches, moisDisponibles, visiteursIds] = await Promise.all([
        Fiche.find(filtres)
            .select("lignesForfait lignesHorsForfait")
            .lean(),
        Fiche.distinct("mois"),
        Fiche.distinct("visiteur"),
    ]);
    const visiteurs = await Visiteur.find({
        _id: { $in: visiteursIds },
        role: "visiteur",
    })
        .select("prenom nom")
        .sort({ nom: 1, prenom: 1 })
        .lean();

    const totaux = Object.fromEntries(TYPES_FRAIS.map(({ code }) => [code, 0]));

    fiches.forEach((fiche) => {
        (fiche.lignesForfait || []).forEach((ligne) => {
            totaux[ligne.codeType] += ligne.quantite * bareme.montant(ligne.codeType);
        });
        (fiche.lignesHorsForfait || []).forEach((ligne) => {
            totaux.HF += ligne.montant;
        });
    });

    const types = TYPES_FRAIS.map(({ code, libelle }) => ({
        code,
        libelle,
        total: Math.round(totaux[code] * 100) / 100,
    }));
    const total = Math.round(
        types.reduce((somme, type) => somme + type.total, 0) * 100,
    ) / 100;

    res.json({
        types,
        total,
        nombreNotes: fiches.length,
        filtres: selection,
        options: {
            mois: moisDisponibles.sort((a, b) => b.localeCompare(a)),
            visiteurs: visiteurs.map((visiteur) => ({
                id: String(visiteur._id),
                nom: `${visiteur.prenom} ${visiteur.nom}`,
            })),
            etats: ETATS,
        },
    });
});