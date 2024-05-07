const { Router } = require("express");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");
const { agregarOpcion, borrarOpcion, agregarProceso, listarTipoContratacion, listarTipoInstrumento, agregarContratacion, listarContratacion, listarContratacionBack, borrarContratacion, editarContratacion } = require("../controllers/adminControllers");

const router = Router();
const multer  = require('multer');
// Configurar multer para manejar la carga de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'C:/Users/Tobias/Desktop');
        },
    filename: function (req, file, cb) {
        const { num_instrumento, expte } = req.body;
        const nombreArchivo = `CONTRATACION_${num_instrumento}_EXPTE_${expte}.pdf`;
        cb(null, nombreArchivo);
        }
    });

const upload = multer({ storage: storage });

router.post("/altaOpcion", agregarOpcion);
router.post("/altaProceso", agregarProceso);
router.post("/borrarOpcion", borrarOpcion);

//--------Contrataciones-------------
router.get("/listaTipoContratacion", listarTipoContratacion);
router.get("/listarTipoIntrumentos", listarTipoInstrumento);
router.get("/listarContratacionBack", listarContratacionBack);
router.get("/listarContratacion", listarContratacion);
router.post("/agregarContratacion", upload.single('archivo'), agregarContratacion);
router.put("/editarContratacion", upload.single('archivo'), editarContratacion);
router.post("/borrarContratacion", borrarContratacion);
//--------Contrataciones-------------


module.exports = router;