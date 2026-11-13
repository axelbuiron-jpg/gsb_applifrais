const router = require("express").Router();
const ctrl = require("../controllers/fiches.controller");
const { requireAuth, requireRole } = require("../middlewares/auth");

router.use(requireAuth); // tout exige un compte
router.get("/", ctrl.lister);
router.post("/", requireRole("visiteur"), ctrl.creer);
router.get("/:id", ctrl.lire);
router.post("/:id/lignes", requireRole("visiteur"), ctrl.ajouterLigne);
router.put("/:id/cloturer", requireRole("visiteur"), ctrl.cloturer);
router.put("/:id/valider", requireRole("comptable"), ctrl.valider);
module.exports = router;
