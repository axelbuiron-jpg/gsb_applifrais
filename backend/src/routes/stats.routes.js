const router = require("express").Router();

router.get("/", (req, res) => {
  res.json({ message: "Stats OK" });
});

module.exports = router;
