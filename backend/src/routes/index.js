const router = require("express").Router();

router.use("/auth", require("./auth.routes"));
router.use("/fiches", require("./fiches.routes"));
router.use("/stats", require("./stats.routes"));

module.exports = router;