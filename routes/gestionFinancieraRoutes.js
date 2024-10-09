const { Router } = require("express");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");



const { 
    listarAnexos, 
    agregarAnexo, 
    editarAnexo, 
    borrarAnexo, 
    listarFinalidades, 
    agregarFinalidad, 
    editarFinalidad, 
    borrarFinalidad, 
    listarFunciones, 
    agregarFuncion, 
    editarFuncion, 
    borrarFuncion, 
    listarItems, 
    agregarItem, 
    editarItem, 
    borrarItem, 
    listarPartidas, 
    agregarPartida, 
    editarPartida, 
    borrarPartida, 
    agregarEjercicio, 
    editarEjercicio, 
    borrarEjercicio, 
    listarTiposDeMovimientos, 
    listarOrganismos, 
    agregarExpediente, 
    listarPartidasConCodigo, 
    obtenerDetPresupuestoPorItemYpartida, 
    agregarMovimiento, 
    listarPartidasCONCAT, 
    partidaExistente, 
    buscarExpediente, 
    listarAnteproyecto, 
    actualizarPresupuestoAnteproyecto, 
    listarEjercicio, 
    actualizarCredito, 
    actualizarPresupuestoAprobado, 
    modificarMovimiento, 
    obtenerPartidasPorItemYMovimiento, 
    editarDetalleMovimiento, 
    acumular, 
    buscarExpedienteParaModificarDefinitiva, 
    agregarMovimientoDefinitivaPreventiva, 
    obtenerPresupuestosParaMovimientoPresupuestario, 
    listarItemsFiltrado, 
    obtenerPerfilPorCuil, 
    actualizarCreditoCompleto, 
    actualizarPresupuestoAprobadoCompleto, 
    obtenerTiposDeInstrumentos, 
    obtenerSaldoPorDetPresupuestoID, 
    obtenerProveedores, 
    editarProveedor, 
    agregarProveedor, 
    eliminarProveedor, 
    obtenerRubros, 
    agregarRubro, 
    crearEstructuraItem, 
    listarItemsSinPartidas, 
    obtenerProveedor, 
    agregarMovimientoPorTransferenciaDePartidas, 
    modificarMovimientoParaTransferenciaEntrePartidas, 
    buscarExpedienteParaModificarPorTransferenciaEntrePartidas, 
    eliminarNomenclador,
    agregarNomenclador,
    editarNomenclador,
    obtenerNomencladores,
    listarPartidasConCodigoGasto,
    buscarExpedienteParaModificarNomenclador,
    obtenerEncuadres,
    obtenerEncuadresLegales,
    editarEncuadreLegal,
    agregarEncuadreLegal,
    eliminarEncuadreLegal,
    modificarMovimientoAltaDeCompromiso,
    obtenerTiposDeCompras
  } = require("../controllers/gestionFinancieraControllers");
  


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
router.get("/item/listarSinPartidas", listarItemsSinPartidas);
router.post("/item/listar/:cuil", listarItemsFiltrado);
router.post("/item/alta", agregarItem)
router.put("/item/editar/:id",editarItem)
router.delete("/item/borrar", borrarItem)

router.get("/partida/obtenerPartidasPorItemYMovimiento",obtenerPartidasPorItemYMovimiento)
router.get("/partida/listar", listarPartidas);
router.get("/partida/listarConCodigo", listarPartidasConCodigo);
router.get("/partida/listarConCodigoGasto", listarPartidasConCodigoGasto);
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
router.get("/expediente/buscarExpedienteParaTransferencias", buscarExpedienteParaModificarPorTransferenciaEntrePartidas)

router.patch("/editarDetalleMovimiento", editarDetalleMovimiento)

router.get("/detPresupuesto/obtenerPorItemYPartida", obtenerDetPresupuestoPorItemYpartida)
router.get("/detPresupuesto/obtenerSaldoPorDetPresupuestoID", obtenerSaldoPorDetPresupuestoID)

router.post("/movimiento/alta",agregarMovimiento)
router.post("/movimiento/altaDefinitivaPreventiva",agregarMovimientoDefinitivaPreventiva)
router.post("/movimiento/altaPorTransferenciaEntrePartidas",agregarMovimientoPorTransferenciaDePartidas)
router.patch("/movimiento/editarPorTransferenciaEntrePartidas",modificarMovimientoParaTransferenciaEntrePartidas)
router.patch("/movimiento/editarAltaDeCompromiso",modificarMovimientoAltaDeCompromiso)
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

router.post('/anteproyecto/crearEstructura', crearEstructuraItem);


router.get("/proveedores/listar", obtenerProveedores);
router.put("/proveedores/editar", editarProveedor);
router.post("/proveedores/agregar", agregarProveedor);
router.delete("/proveedores/eliminar/:idEliminar", eliminarProveedor);

//EJECUCION DE GASTOS
router.get("/proveedor/listar", obtenerProveedor);
//

router.get("/rubros/listar", obtenerRubros);
router.post("/rubros/agregar", agregarRubro);

router.get("/nomencladores/listar", obtenerNomencladores);
router.put("/nomencladores/editar", editarNomenclador);
router.post("/nomencladores/agregar", agregarNomenclador);
router.delete("/nomencladores/eliminar/:idEliminar", eliminarNomenclador);

router.get("/detmovimiento_nomenclador/buscar", buscarExpedienteParaModificarNomenclador);

router.get("/encuadres/listar", obtenerEncuadres)
router.get("/encuadrelegal/listar", obtenerEncuadresLegales);
router.put("/encuadrelegal/editar", editarEncuadreLegal);
router.post("/encuadrelegal/agregar", agregarEncuadreLegal);
router.delete("/encuadrelegal/eliminar/:idEliminar", eliminarEncuadreLegal);

router.get("/tipocompra/listar", obtenerTiposDeCompras)

module.exports = router;