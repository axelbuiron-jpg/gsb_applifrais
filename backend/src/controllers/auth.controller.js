const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const Visiteur = require("../models/visiteur.model");
const AppError = require("../utils/AppError");

const inscriptionSchema = z.object({
    nom: z.string().trim().min(1).max(80),
    prenom: z.string().trim().min(1).max(80),
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(8).max(128),
    role: z.enum(["visiteur", "comptable"]).default("visiteur"),
});

const loginSchema = z.object({
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(1),
});

function creerSession(visiteur) {
    const token = jwt.sign({ sub: visiteur._id, role: visiteur.role },
        process.env.JWT_SECRET, { expiresIn: "8h" });
    return {
        token,
        visiteur: {
            id: visiteur._id,
            nom: visiteur.nom,
            prenom: visiteur.prenom,
            role: visiteur.role,
        },
    };
}

exports.login = async (req, res) => {
    const { email, password } = loginSchema.parse(req.body); // ① valide -> bloque l'injection
    const v = await Visiteur.findOne({ email }); // ② cherche par email
    if (!v || !(await bcrypt.compare(password, v.motDePasseHash)))
        throw new AppError("Identifiants invalides", 401); // ③ même message dans les 2 cas
    res.json(creerSession(v));
};

exports.inscrire = async (req, res) => {
    const donnees = inscriptionSchema.parse(req.body);

    if (await Visiteur.exists({ email: donnees.email })) {
        throw new AppError("Un compte existe déjà avec cette adresse e-mail", 409);
    }

    const visiteur = await Visiteur.create({
        nom: donnees.nom,
        prenom: donnees.prenom,
        email: donnees.email,
        motDePasseHash: await bcrypt.hash(donnees.password, 12),
        role: donnees.role,
    });
    res.status(201).json(creerSession(visiteur));
};

exports.moi = async (req, res) => res.json(req.user); // qui suis-je ? (jeton -> req.user)