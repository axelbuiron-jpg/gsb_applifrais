const router = require("express").Router();
const ctrl = require("../controllers/fiches.controller");
const ocr = require("../controllers/ocr.controller");
const { requireAuth, requireRole } = require("../middlewares/auth");
const multer = require("multer");
const AppError = require("../utils/AppError");

const recevoirImage = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter(_req, file, callback) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
            callback(new AppError("Choisissez une image JPEG, PNG ou WebP", 415));
            return;
        }
        callback(null, true);
    },
}).single("justificatif");

function traiterImage(req, res, next) {
    recevoirImage(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            const message = err.code === "LIMIT_FILE_SIZE"
                ? "L’image ne doit pas dépasser 5 Mo"
                : "Le fichier image n’a pas pu être reçu";
            return next(new AppError(message, err.code === "LIMIT_FILE_SIZE" ? 413 : 400));
        }
        if (err) return next(err);
        next();
    });
}

router.use(requireAuth); // tout exige un compte
router.get("/", ctrl.lister);
router.post("/", requireRole("visiteur"), ctrl.creer);
router.post("/analyse", requireRole("visiteur"), traiterImage, ocr.analyser);
router.get("/:id", ctrl.lire);
router.post("/:id/lignes", requireRole("visiteur"), ctrl.ajouterLigne);
router.put("/:id/cloturer", requireRole("visiteur"), ctrl.cloturer);
router.put("/:id/valider", requireRole("comptable"), ctrl.valider);
router.put("/:id/etat", requireRole("comptable"), ctrl.changerEtat);
router.delete("/:id", requireRole("visiteur"), ctrl.supprimer);
module.exports = router;
