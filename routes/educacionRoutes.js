const { Router } = require("express");
const auth = require("../middlewares/auth");
const validateFields = require("../middlewares/validateFields");
const { check } = require("express-validator");
const verifyRole = require("../middlewares/verifyRole");
const { listarConvocatorias, listarNiveles, listarEstablecimientos, listarCausal, listarCaracter } = require("../controllers/educacionCrontrollers");

const router = Router();


router.get("/listarConvocatorias", listarConvocatorias)
router.get("/listarNiveles", listarNiveles)
router.get("/listarEstablecimientos", listarEstablecimientos)
router.get("/listarCausal", listarCausal)
router.get("/listarCaracter", listarCaracter)
// router.get("/listar/:id?",auth,verifyRole,obtenerUsuarios)
// router.put("/editar", editarUsuarioCompleto)


module.exports = router;