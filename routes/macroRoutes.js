const { Router } = require("express");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");
const { obtenerCategorias, obtenerTiposDeReclamoPorCategoria, listarReclamosCiudadano,ingresarReclamo, buscarReclamoPorId, obtenerTurnosDisponiblesPorDia, obtenerTurnosDisponiblesPorHora, existeTurno, confirmarTurno, anularTurno, usuarioExistente, tipoUsuario } = require("../controllers/macroControllers");

const router = Router();

router.get("/listarCategorias", obtenerCategorias);
router.get('/listarTiposDeReclamosPorCategoria', obtenerTiposDeReclamoPorCategoria);
router.post('/ingresarReclamo',ingresarReclamo)//HACER VALIDACIONES CON CHECK

router.get("/listarReclamosCiudadano",listarReclamosCiudadano) //REVISADO Y AGREGADO DE ESTADO_TRAMITE
router.get("/buscarReclamoPorId",buscarReclamoPorId) //REVISADO Y AGREGADO DE ESTADO_TRAMITE
router.get("/buscarTurnosDisponiblesPorDia",obtenerTurnosDisponiblesPorDia)
router.get("/buscarTurnosDisponiblesPorHora",obtenerTurnosDisponiblesPorHora)
router.get("/existeTurno", existeTurno)
router.get("/confirmarTurno", confirmarTurno)
router.get("/anularTurno", anularTurno)

router.get("/existe", usuarioExistente)// USUARIO EXISTE EN BD_MUNI POR CUIT Y/O EMAIL
router.get("/tipoUsuario", tipoUsuario)// TIPO DE USUARIO EN BD_MUNI

module.exports = router;