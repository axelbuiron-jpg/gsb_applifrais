const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const ctrl = require("../controllers/auth.controller");
const { requireAuth } = require("../middlewares/auth");

const limiteLogin = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }); // 5 essais / 15 min

router.post("/login", limiteLogin, ctrl.login); // public, mais ralenti
router.get("/me", requireAuth, ctrl.moi); // besoin d'un jeton valide
module.exports = router;