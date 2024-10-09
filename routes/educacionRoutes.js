const { Router } = require("express");
const auth = require("../middlewares/auth");
const validateFields = require("../middlewares/validateFields");
const { check } = require("express-validator");
const verifyRole = require("../middlewares/verifyRole");
const { listarConvocatorias, listarNiveles, listarEstablecimientos, listarCausal, listarCaracter, editarConvocatoria, agregarConvocatoria, agregarCausal, listarCausalTabla, editarCausal, borrarCausal, listarConvocatoriasTabla, listarNivelesTabla, agregarNivel, editarNivel, listarEstablecimientosTabla, agregarEstablecimiento, editarEstablecimiento, listarCaracterTabla, agregarCaracter, editarCaracter } = require("../controllers/educacionCrontrollers");

const router = Router();
const multer  = require('multer');
// Configurar multer para manejar la carga de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'C:/Users/Tobias/Desktop');
        },
    filename: function (req, file, cb) {
        const { num_convocatoria, anio_convocatoria, expte } = req.body;
        const nombreArchivo = `CONVOCATORIA_${num_convocatoria}_${anio_convocatoria}_EXPTE_${expte}.pdf`;
        cb(null, nombreArchivo);
        }
    });

const upload = multer({ storage: storage });

router.get("/listarConvocatorias", listarConvocatorias)
router.get("/listarConvocatoriasTabla", listarConvocatoriasTabla)
router.post("/agregarConvocatoria", upload.single('archivo'), agregarConvocatoria);
router.put("/editarConvocatoria", upload.single('archivo'), editarConvocatoria)

router.get("/listarNiveles", listarNiveles)
router.get("/listarNivelesTabla", listarNivelesTabla)
router.post("/agregarNivel", agregarNivel)
router.post("/editarNivel", editarNivel)

router.get("/listarEstablecimientos", listarEstablecimientos)
router.get("/listarEstablecimientosTabla", listarEstablecimientosTabla)
router.post("/agregarEstablecimiento", agregarEstablecimiento);
router.post("/editarEstablecimiento", editarEstablecimiento);

router.get("/listarCausalTabla", listarCausalTabla);
router.get("/listarCausal", listarCausal)
router.post("/agregarCausal", agregarCausal);
router.post("/editarCausal", editarCausal);

router.get("/listarCaracter", listarCaracter)
router.get("/listarCaracterTabla", listarCaracterTabla)
router.post("/agregarCaracter", agregarCaracter)
router.post("/editarCaracter", editarCaracter)

// router.get("/listar/:id?",auth,verifyRole,obtenerUsuarios)


module.exports = router;