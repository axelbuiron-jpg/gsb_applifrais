const router = require("express").Router();
const ctrl = require("../controllers/stats.controller");
const { requireAuth, requireRole } = require("../middlewares/auth");

router.get("/", requireAuth, requireRole("comptable"), ctrl.lire);

module.exports = router;
