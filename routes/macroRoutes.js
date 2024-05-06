const { Router } = require("express");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");
const { obtenerCategorias, obtenerTiposDeReclamoPorCategoria, listarReclamosCiudadano,ingresarReclamo, buscarReclamoPorId, obtenerTurnosDisponiblesPorDia, obtenerTurnosDisponiblesPorHora, existeTurno, confirmarTurno, anularTurno } = require("../controllers/macroControllers");

const router = Router();

router.get("/listarCategorias", obtenerCategorias);
router.get('/listarTiposDeReclamosPorCategoria', obtenerTiposDeReclamoPorCategoria);
router.post('/ingresarReclamo',ingresarReclamo)//HACER VALIDACIONES CON CHECK

router.get("/listarReclamosCiudadano",listarReclamosCiudadano) //REVISAR
router.get("/buscarReclamoPorId",buscarReclamoPorId) //REVISAR
router.get("/buscarTurnosDisponiblesPorDia",obtenerTurnosDisponiblesPorDia)
router.get("/buscarTurnosDisponiblesPorHora",obtenerTurnosDisponiblesPorHora)
router.get("/existeTurno", existeTurno)
router.get("/confirmarTurno", confirmarTurno)
router.get("/anularTurno", anularTurno)

module.exports = router;