const { Router } = require("express");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");
const { agregarTipoDeUsuario, obtenerRoles, editarRol, borrarRol } = require("../controllers/tiposDeUsuariosControllers");
const { check } = require("express-validator");
const validateFields = require("../middlewares/validateFields");

const router = Router();

router.post("/alta", auth, verifyRole, agregarTipoDeUsuario);
router.get("/listar",auth,verifyRole,obtenerRoles)
router.put("/:id",auth,verifyRole,editarRol)
router.delete("/",[auth,verifyRole, check("id").not().isEmpty(), validateFields,],borrarRol)

module.exports = router;