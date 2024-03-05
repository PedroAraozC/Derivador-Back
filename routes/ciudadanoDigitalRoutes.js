const { Router } = require("express");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");
const { listarOpciones, listarProcesos, listarTiposDeUsuarios, obtenerPaisesMYSQL, obtenerProvinciasMYSQL, obtenerGeneroMYSQL, obtenerDocumentoMYSQL } = require("../controllers/ciudadanoDigitalControllers");
const router = Router();

router.get("/listarOpciones",auth,verifyRole, listarOpciones);
router.get("/listarProcesos",auth,verifyRole, listarProcesos);
router.get("/listarTiposDeUsuarios",auth,verifyRole, listarTiposDeUsuarios);

router.get("/paises",obtenerPaisesMYSQL); 
router.get("/provincias",obtenerProvinciasMYSQL); 
router.get("/genero",obtenerGeneroMYSQL); 
router.get("/documento",obtenerDocumentoMYSQL); 

module.exports = router;