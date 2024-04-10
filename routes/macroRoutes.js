const { Router } = require("express");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");
const { obtenerCategorias, obtenerTiposDeReclamoPorCategoria, listarReclamosCiudadano,ingresarReclamo, buscarReclamoPorId } = require("../controllers/macroControllers");

const router = Router();

router.get("/listarCategorias", obtenerCategorias);
router.get('/listarTiposDeReclamosPorCategoria', obtenerTiposDeReclamoPorCategoria);
router.post('/ingresarReclamo',ingresarReclamo)//HACER VALIDACIONES CON CHECK

router.get("/listarReclamosCiudadano",listarReclamosCiudadano)
router.get("/buscarReclamoPorId",buscarReclamoPorId)

module.exports = router;