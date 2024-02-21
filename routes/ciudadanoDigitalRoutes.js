const { Router } = require("express");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");
const { listarOpciones, listarProcesos, listarTiposDeUsuarios } = require("../controllers/ciudadanoDigitalControllers");
const router = Router();

router.get("/listarOpciones",auth,verifyRole, listarOpciones);
router.get("/listarProcesos",auth,verifyRole, listarProcesos);
router.get("/listarTiposDeUsuarios",auth,verifyRole, listarTiposDeUsuarios);

module.exports = router;