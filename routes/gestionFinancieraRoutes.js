const { Router } = require("express");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");
const { listarAnexos, agregarAnexo, editarAnexo, borrarAnexo, listarFinalidades, agregarFinalidad, editarFinalidad, borrarFinalidad } = require("../controllers/gestionFinancieraControllers");
const router = Router();

router.get("/anexo/listar", listarAnexos);
router.post("/anexo/alta", agregarAnexo)
router.put("/anexo/editar/:id",editarAnexo)
router.delete("/anexo/borrar", borrarAnexo)

// router.get("/funcion/listar", listarFunciones);
// router.post("/funcion/alta", agregarFuncion)
// router.put("/funcion/editar/:id",editarFuncion)
// router.delete("/funcion/borrar", borrarFuncion)

router.get("/finalidad/listar", listarFinalidades);
router.post("/finalidad/alta", agregarFinalidad)
router.put("/finalidad/editar/:id",editarFinalidad)
router.delete("/finalidad/borrar", borrarFinalidad)

// router.get("/item/listar", listarItems);
// router.post("/item/alta", agregarItem)
// router.put("/item/editar/:id",editarItem)
// router.delete("/item/borrar", borrarItem)

module.exports = router;