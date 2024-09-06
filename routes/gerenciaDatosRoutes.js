const { Router } = require("express");
const { obtenerReparticiones, eliminarReparticion, obtenerReparticionesGED, agregarReparticionGED, editarReparticionGED, eliminarReparticionGED, obtenerProgramasGED, agregarProgramaGED, editarProgramaGED, eliminarProgramaGED } = require("../controllers/gerenciaDatosControllers");
const { agregarReparticion, editarReparticion } = require("../controllers/adminControllers");

const router = Router();


////////////REPARTICIONES///////////////

router.get("/reparticiones/listar", obtenerReparticionesGED);
router.post("/reparticiones/agregar", agregarReparticionGED);
router.put("/reparticiones/editar", editarReparticionGED);
router.delete("/reparticiones/eliminar/:reparticion_id", eliminarReparticionGED);

//////////PROGRAMAS /////////////////////

router.get("/programas/listar", obtenerProgramasGED);
router.post("/programas/agregar", agregarProgramaGED);
router.put("/programas/editar", editarProgramaGED);
router.delete("/programas/eliminar/:programa_id", eliminarProgramaGED);



module.exports = router;







