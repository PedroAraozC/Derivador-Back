const { Router } = require("express");
const auth = require("../middlewares/auth");
const validateFields = require("../middlewares/validateFields");
const { check } = require("express-validator");
const { login, agregarUsuario, getAuthStatus, obtenerUsuarios, editarUsuario, borrarUsuario } = require("../controllers/ditecUsuariosControllers");
const verifyRole = require("../middlewares/verifyRole")

const router = Router();

router.post(
    "/login",
    [
        check("nombreUsuario", "El nombre de usuario no cumple con los requisitos").not().isEmpty().isLength({ min: 4, max: 15 }),
        check("password", "La contraseña no cumple con los requisitos").isLength({ min: 6, max: 30 }),
        validateFields,
    ],
    login
);

router.post("/alta", auth, verifyRole, agregarUsuario);
router.get("/authStatus", auth, getAuthStatus);
router.get("/listar/:id?",auth,verifyRole,obtenerUsuarios)
router.put("/:id",auth,verifyRole,editarUsuario)
router.delete("/",auth,verifyRole,borrarUsuario)

module.exports = router;