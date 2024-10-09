const { Router } = require("express");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");
const { traerLinks } = require("../controllers/panelGestionControllers");
const router = Router();

router.post("/listarLinks",auth, traerLinks);


module.exports = router;