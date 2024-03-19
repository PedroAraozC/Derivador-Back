const { Router } = require("express");
const auth = require("../middlewares/auth");
const validateFields = require("../middlewares/validateFields");
const { check } = require("express-validator");
const verifyRole = require("../middlewares/verifyRole");
const { listarConvocatorias, listarNiveles, listarEstablecimientos, listarCausal, listarCaracter, editarConvocatoria, agregarConvocatoria } = require("../controllers/educacionCrontrollers");

const router = Router();


router.get("/listarConvocatorias", listarConvocatorias)
router.get("/listarNiveles", listarNiveles)
router.get("/listarEstablecimientos", listarEstablecimientos)
router.get("/listarCausal", listarCausal)
router.get("/listarCaracter", listarCaracter)
router.put("/editarConvocatoria", editarConvocatoria)
router.post("/agregarConvocatoria", agregarConvocatoria)
// router.get("/listar/:id?",auth,verifyRole,obtenerUsuarios)


module.exports = router;