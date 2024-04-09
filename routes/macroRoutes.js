const { Router } = require("express");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");
const { obtenerCategorias, obtenerTiposDeReclamoPorCategoria, listarReclamosCiudadano } = require("../controllers/macroControllers");
const router = Router();

router.get("/listarCategorias", obtenerCategorias);
router.get('/listarTiposDeReclamosPorCategoria', obtenerTiposDeReclamoPorCategoria);
router.get("/listarReclamosCiudadano",listarReclamosCiudadano)

module.exports = router;