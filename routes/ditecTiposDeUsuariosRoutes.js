const { Router } = require("express");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");
const { agregarTipoDeUsuario, obtenerRoles } = require("../controllers/ditecTiposDeUsuariosControllers");

const router = Router();

router.post("/alta", auth, verifyRole, agregarTipoDeUsuario);
router.get("/listar",auth,verifyRole,obtenerRoles)

module.exports = router;