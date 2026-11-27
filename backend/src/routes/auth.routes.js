const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const ctrl = require("../controllers/auth.controller");
const { requireAuth } = require("../middlewares/auth");
const asyncHandler = require("../utils/asyncHandler");

const limiteLogin = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }); // 5 essais / 15 min
const limiteInscription = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

router.post("/login", limiteLogin, asyncHandler(ctrl.login)); // public, mais ralenti
router.post("/register", limiteInscription, asyncHandler(ctrl.inscrire));
router.get("/me", requireAuth, asyncHandler(ctrl.moi)); // besoin d'un jeton valide
module.exports = router;