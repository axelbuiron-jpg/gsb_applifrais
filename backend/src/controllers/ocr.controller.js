const Tesseract = require("tesseract.js");
const Fiche = require("../models/fiche.model");
const { lienTemporaire } = require("../config/services/stockage");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

function extraireMontant(texte) {
    const nombre = String.raw`(?:\d{1,3}(?:[ \u00a0]\d{3})*|\d+)[,.]\d{2}`;
    const euros = [...texte.matchAll(new RegExp(
        `(${nombre})\\s*(?:EUR\\b|€)|(?:EUR\\b|€)\\s*(${nombre})`,
        "gi",
    ))].map((match) => match[1] || match[2]);
    const montants = euros.length ? euros : texte.match(new RegExp(nombre, "g"));
    if (!montants) return null;
    if (!euros.length && /\b(?:CHF|CHE|USD|GBP|CAD|AUD|JPY)\b/i.test(texte)) return null;
    return Math.max(...montants.map((montant) =>
        Number(montant.replace(/[ \u00a0]/g, "").replace(",", "."))));
}

function formaterDate(annee, mois, jour) {
    const date = new Date(Date.UTC(annee, mois - 1, jour));
    if (date.getUTCFullYear() !== annee
        || date.getUTCMonth() !== mois - 1
        || date.getUTCDate() !== jour) return null;
    return `${annee}-${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
}

function extraireDate(texte) {
    const iso = texte.match(/\b(20\d{2})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{1,2})\b/);
    if (iso) return formaterDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));

    const francaise = texte.match(/\b(\d{1,2})\s*[/. -]\s*(\d{1,2})\s*[/. -]\s*(\d{2,4})\b/);
    if (!francaise) return null;
    const annee = Number(francaise[3]) < 100
        ? 2000 + Number(francaise[3])
        : Number(francaise[3]);
    return formaterDate(annee, Number(francaise[2]), Number(francaise[1]));
}

function extraireLibelle(texte) {
    const exclusions = /^(?:famille|family|familie|total|montant|tva|cb|carte|ticket|facture|date|siret|merci|re[çc]u|rech)\b/i;
    const lignes = texte.split(/\r?\n/).slice(0, 10);
    const noms = lignes.flatMap((ligne) => {
        const valeur = ligne.trim();
        if (!valeur || /\d{3,}/.test(valeur) || exclusions.test(valeur)) return [];
        const mots = valeur.replace(/\d+/g, " ")
            .match(/[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ'’-]{2,}/g) || [];
        const nom = mots.filter((mot) => !exclusions.test(mot)).join(" ");
        return nom ? [nom] : [];
    });

    return noms.length ? noms.slice(0, 2).join(" ").slice(0, 100) : null;
}

function imageValide(buffer, type) {
    if (type === "image/jpeg") {
        return buffer.length >= 3
            && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    if (type === "image/png") {
        return buffer.length >= 8
            && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    }
    return type === "image/webp"
        && buffer.length >= 12
        && buffer.toString("ascii", 0, 4) === "RIFF"
        && buffer.toString("ascii", 8, 12) === "WEBP";
}

// POST /fiches/analyse — analyse le reçu sans le conserver ni créer le frais
exports.analyser = asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError("Aucune image reçue", 400);
    if (!imageValide(req.file.buffer, req.file.mimetype)) {
        throw new AppError("Le fichier reçu n’est pas une image valide", 415);
    }

    const worker = await Tesseract.createWorker("deu+fra+eng");
    let data;
    try {
        await worker.setParameters({
            tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        });
        ({ data } = await worker.recognize(req.file.buffer));
    } finally {
        await worker.terminate();
    }

    const proposition = {
        date: extraireDate(data.text),
        libelle: extraireLibelle(data.text),
        montant: extraireMontant(data.text),
    };
    if (!proposition.date && !proposition.libelle && proposition.montant === null) {
        throw new AppError("Aucune information lisible. Essayez une photo nette, bien éclairée et cadrée sur le reçu.", 422);
    }

    res.json({
        proposition,
        confiance: Math.round(data.confidence),
    });
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
