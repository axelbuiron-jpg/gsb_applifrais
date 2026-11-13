const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const Visiteur = require("../models/visiteur.model");
const AppError = require("../utils/AppError");

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

exports.login = async (req, res) => {
    const { email, password } = loginSchema.parse(req.body); // ① valide -> bloque l'injection
    const v = await Visiteur.findOne({ email }); // ② cherche par email
    if (!v || !(await bcrypt.compare(password, v.motDePasseHash)))
        throw new AppError("Identifiants invalides", 401); // ③ même message dans les 2 cas
    const token = jwt.sign({ sub: v._id, role: v.role }, // ④ jeton signé
        process.env.JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, visiteur: { id: v._id, nom: v.nom, prenom: v.prenom, role: v.role } });
};

exports.moi = async (req, res) => res.json(req.user); // qui suis-je ? (jeton -> req.user)