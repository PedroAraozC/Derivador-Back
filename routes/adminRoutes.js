const { Router } = require("express");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");
const { agregarOpcion, borrarOpcion } = require("../controllers/adminControllers");

const router = Router();

router.post("/altaOpcion", agregarOpcion);
router.post("/borrarOpcion", borrarOpcion);


module.exports = router;