const { Router } = require("express");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");
const { agregarOpcion } = require("../controllers/adminControllers");

const router = Router();

router.post("/altaOpcion", agregarOpcion);


module.exports = router;