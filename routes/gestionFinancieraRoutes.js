const { Router } = require("express");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");



const { listarAnexos, agregarAnexo, editarAnexo, borrarAnexo, listarFinalidades, agregarFinalidad, editarFinalidad, borrarFinalidad, listarFunciones, agregarFuncion, editarFuncion, borrarFuncion, listarItems, agregarItem, editarItem, borrarItem, listarPartidas, agregarPartida, editarPartida, borrarPartida, agregarEjercicio, editarEjercicio, borrarEjercicio, listarTiposDeMovimientos, listarOrganismos, agregarExpediente, listarPartidasConCodigo, obtenerDetPresupuestoPorItemYpartida, agregarMovimiento, listarPartidasCONCAT,partidaExistente, buscarExpediente,listarAnteproyecto, actualizarPresupuestoAnteproyecto, listarEjercicio, actualizarCredito, actualizarPresupuestoAprobado, modificarMovimiento, obtenerPartidasPorItemYMovimiento, editarDetalleMovimiento,acumular, buscarExpedienteParaModificarDefinitiva, agregarMovimientoDefinitivaPreventiva, obtenerPresupuestosParaMovimientoPresupuestario, listarItemsFiltrado, obtenerPerfilPorCuil, actualizarCreditoCompleto, actualizarPresupuestoAprobadoCompleto, obtenerTiposDeInstrumentos, obtenerSaldoPorDetPresupuestoID } = require("../controllers/gestionFinancieraControllers");


const router = Router();

router.get("/anexo/listar", listarAnexos);
router.post("/anexo/alta", agregarAnexo)
router.put("/anexo/editar/:id",editarAnexo)
router.delete("/anexo/borrar", borrarAnexo)

router.get("/funcion/listar", listarFunciones);
router.post("/funcion/alta", agregarFuncion)
router.put("/funcion/editar/:id",editarFuncion)
router.delete("/funcion/borrar", borrarFuncion)

router.get("/finalidad/listar", listarFinalidades);
router.post("/finalidad/alta", agregarFinalidad)
router.put("/finalidad/editar/:id",editarFinalidad)
router.delete("/finalidad/borrar", borrarFinalidad)

router.get("/ejercicio/listar", listarEjercicio);
router.post("/ejercicio/alta", agregarEjercicio)
router.put("/ejercicio/editar/:id",editarEjercicio)
router.delete("/ejercicio/borrar", borrarEjercicio)

router.get("/item/listar", listarItems);
router.post("/item/listar/:cuil", listarItemsFiltrado);
router.post("/item/alta", agregarItem)
router.put("/item/editar/:id",editarItem)
router.delete("/item/borrar", borrarItem)

router.get("/partida/obtenerPartidasPorItemYMovimiento",obtenerPartidasPorItemYMovimiento)
router.get("/partida/listar", listarPartidas);
router.get("/partida/listarConCodigo", listarPartidasConCodigo);
router.get("/partida/listar/concat", listarPartidasCONCAT);
router.post("/partida/existente", partidaExistente);
router.post("/partida/alta", agregarPartida)
router.put("/partida/editar/:id",editarPartida)
router.delete("/partida/borrar", borrarPartida)

router.get("/tipoDeMovimiento/listar", listarTiposDeMovimientos);

router.get("/organismo/listar", listarOrganismos);

router.post("/expediente/alta",agregarExpediente)
router.get("/expediente/buscar", buscarExpediente)
router.get("/expediente/buscarExpedienteComun", buscarExpedienteParaModificarDefinitiva)

router.patch("/editarDetalleMovimiento", editarDetalleMovimiento)

router.get("/detPresupuesto/obtenerPorItemYPartida", obtenerDetPresupuestoPorItemYpartida)
router.get("/detPresupuesto/obtenerSaldoPorDetPresupuestoID", obtenerSaldoPorDetPresupuestoID)

router.post("/movimiento/alta",agregarMovimiento)
router.post("/movimiento/altaDefinitivaPreventiva",agregarMovimientoDefinitivaPreventiva)

router.patch("/movimiento/editar",modificarMovimiento)
router.get("/movimiento/tipoInstrumento", obtenerTiposDeInstrumentos)

router.get("/anteproyecto/listar", listarAnteproyecto);

router.put("/anteproyecto/editar", actualizarPresupuestoAnteproyecto);

router.put("/credito/editar", actualizarCredito);

router.put("/credito/editarCompleto", actualizarCreditoCompleto);

router.put("/presupuesto/editar", actualizarPresupuestoAprobado);
router.get("/presupuesto/listar", obtenerPresupuestosParaMovimientoPresupuestario)

router.put("/presupuesto/editarCompleto", actualizarPresupuestoAprobadoCompleto);

router.put("/acumular", acumular);

router.post('/perfil/:cuil', obtenerPerfilPorCuil);

module.exports = router;