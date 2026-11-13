const { ZodError } = require("zod");
module.exports = (err, req, res, next) => {
    if (err instanceof ZodError)
        return res.status(400).json({ error: "Données invalides",
            champs: err.issues.map((e) => ({ champ: e.path.join("."), message: e.message })) });
    if (err.code === 11000)
        return res.status(409).json({ error: "Doublon : une fiche existe déjà pour ce mois" });
    res.status(err.statusCode || 500).json({ error: err.message || "Erreur serveur" });
};
