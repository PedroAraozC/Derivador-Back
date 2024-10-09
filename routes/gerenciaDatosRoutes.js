const { Router } = require("express");
const { obtenerReparticiones, eliminarReparticion, obtenerReparticionesGED, agregarReparticionGED, editarReparticionGED, eliminarReparticionGED, obtenerProgramasGED, agregarProgramaGED, editarProgramaGED, eliminarProgramaGED, obtenerIndicadoresGED, agregarIndicadorGED, editarIndicadorGED, eliminarIndicadorGED, obtenerUnidadesGED, obtenerPerfilPorCuilGED, obtenerReparticionesFiltradasGED, obtenerProgramasPorReparticionGED, grabarPlanilla, obtenerPlanillasFiltradas, obtenerDetallesPlanilla, actualizarValorPlanilla } = require("../controllers/gerenciaDatosControllers");
const { agregarReparticion, editarReparticion } = require("../controllers/adminControllers");

const router = Router();

router.post('/perfil/:cuil', obtenerPerfilPorCuilGED);
////////////REPARTICIONES///////////////

router.get("/reparticiones/listar", obtenerReparticionesGED);
router.post("/reparticiones/listar/:cuil", obtenerReparticionesFiltradasGED);
router.post("/reparticiones/agregar", agregarReparticionGED);
router.put("/reparticiones/editar", editarReparticionGED);
router.delete("/reparticiones/eliminar/:reparticion_id", eliminarReparticionGED);

//////////PROGRAMAS /////////////////////

router.get("/programas/listar", obtenerProgramasGED);
router.post("/programas/listar/:reparticion_id", obtenerProgramasPorReparticionGED);
router.post("/programas/agregar", agregarProgramaGED);
router.put("/programas/editar", editarProgramaGED);
router.delete("/programas/eliminar/:programa_id", eliminarProgramaGED);


////////////INDICADORES/////////////////////////
router.get("/indicadores/listar", obtenerIndicadoresGED);
router.get("/unidades/listar", obtenerUnidadesGED);
router.post("/indicadores/agregar", agregarIndicadorGED);
router.put("/indicadores/editar", editarIndicadorGED);
router.delete("/indicadores/eliminar/:indicador_id", eliminarIndicadorGED);

///////////PLANILLAS////////////////////////////////

router.post("/planilla/agregar", grabarPlanilla);
router.post("/planilla/listar", obtenerPlanillasFiltradas);
router.get("/planilla/listarDetalle/:planilla_id", obtenerDetallesPlanilla);
router.put("/planilla/editar", actualizarValorPlanilla);


module.exports = router;







