const { Router } = require("express");
const auth = require("../middlewares/auth");
const validateFields = require("../middlewares/validateFields");
const { check } = require("express-validator");

const { login, getAuthStatus, obtenerUsuarios, editarUsuario, borrarUsuario, agregarUsuarioMYSQL, validarUsuarioMYSQL, obtenerCiudadanoPorEmailMYSQL, obtenerCiudadanoPorDNIMYSQL, editarUsuarioCompleto, enviarEmailValidacion, obtenerPermisos, obtenerOpcionesHabilitadas, editarClave, restablecerClave} = require("../controllers/usuariosControllers");

const verifyRole = require("../middlewares/verifyRole")

const router = Router();

router.post(
    "/login",
    [
        check("dni", "El CUIL de usuario no cumple con los requisitos").not().isEmpty().isInt().isLength({ min: 11, max: 11 }),
        check("password", "La contraseña no cumple con los requisitos").isLength({ min: 4, max: 30 }),
        validateFields,
    ],
    login
);

// router.post("/alta", auth, verifyRole, agregarUsuario);
router.get("/authStatus", auth, getAuthStatus);
router.get("/listar/:id?",auth,verifyRole, obtenerUsuarios)
router.get("/permisos/:id?",auth, obtenerPermisos)
router.get("/opciones",auth, obtenerOpcionesHabilitadas)
// router.put("/:id",auth,verifyRole,editarUsuario)
router.delete("/",[auth,verifyRole, check("id").not().isEmpty(), validateFields,],borrarUsuario)

router.get('/dni/:dni', obtenerCiudadanoPorDNIMYSQL);
router.get('/email/:email', obtenerCiudadanoPorEmailMYSQL);  
router.put("/validar", validarUsuarioMYSQL)
router.put("/editarUsuario", editarUsuarioCompleto)
router.put("/editarClave", editarClave)
router.put("/restablecerClave", restablecerClave)
router.post("/registro",agregarUsuarioMYSQL)
router.put("/email", enviarEmailValidacion)

module.exports = router;