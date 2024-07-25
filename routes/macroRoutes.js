const { Router } = require("express");
const Oauth = require("../middlewares/Oauth");
const verifyIngresoToken = require("../middlewares/verifyIngresoToken");
const verifyRole = require("../middlewares/verifyRole");
const {
  obtenerCategorias,
  obtenerTiposDeReclamoPorCategoria,
  listarReclamosCiudadano,
  ingresarReclamo,
  buscarReclamoPorId,
  obtenerTurnosDisponiblesPorDia,
  obtenerTurnosDisponiblesPorHora,
  existeTurno,
  confirmarTurno,
  anularTurno,
  usuarioExistente,
  tipoUsuario,
  guardarImagen,
  existeLoginApp,
  obtenerTokenAutorizacion,
} = require("../controllers/macroControllers");

const router = Router();

router.get("/listarCategorias", obtenerCategorias);
router.get("/listarTiposDeReclamosPorCategoria", obtenerTiposDeReclamoPorCategoria);
router.post("/ingresarReclamo",Oauth ,ingresarReclamo); //HACER VALIDACIONES CON CHECK
router.post("/pruebaImagen", guardarImagen); //RECONSTRUIR IMAGEN Y GUARDADO LISTO -- FALTA CONFIRMAR LUGAR Y FORMATO PARA ARMAR RUTA DE GUARDADO

router.get("/listarReclamosCiudadano", listarReclamosCiudadano); //REVISADO Y AGREGADO DE ESTADO_TRAMITE
router.get("/buscarReclamoPorId", buscarReclamoPorId); //REVISADO Y AGREGADO DE ESTADO_TRAMITE
router.get("/buscarTurnosDisponiblesPorDia", Oauth, obtenerTurnosDisponiblesPorDia);
router.get("/buscarTurnosDisponiblesPorHora", Oauth, obtenerTurnosDisponiblesPorHora);
router.get("/existeTurno", Oauth, existeTurno);
router.get("/confirmarTurno", Oauth, confirmarTurno);
router.get("/anularTurno", Oauth, anularTurno);

router.get("/existe", usuarioExistente); // USUARIO EXISTE EN BD_MUNI POR CUIT Y/O EMAIL
router.get("/tipoUsuario", tipoUsuario); // TIPO DE USUARIO EN BD_MUNI

router.get("/existeLoginApp/:dni/:password", existeLoginApp); // VERIFICA EXISTENCIA DE USUARIO PARA DAR TOKEN DE INGRESO Y DATOS
router.post("/obtenerTokenAutorizacion", verifyIngresoToken, obtenerTokenAutorizacion);  //OROTGA EL TOKEN DE AUTORIZACION PARA HACER PETICIONES

module.exports = router;
