const { Router } = require("express");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");
const { obtenerCategorias, obtenerTiposDeReclamoPorCategoria, ingresarReclamo } = require("../controllers/macroControllers");
const router = Router();

router.get("/listarCategorias", obtenerCategorias);
router.get('/listarTiposDeReclamosPorCategoria', obtenerTiposDeReclamoPorCategoria);
router.post('/ingresarReclamo',ingresarReclamo)//HACER VALIDACIONES CON CHECK

module.exports = router;