const { Router } = require("express");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");
const { agregarOpcion, borrarOpcion, agregarProceso, listarTipoContratacion, listarTipoInstrumento, agregarContratacion, agregarAnexo, listarContratacion, listarContratacionBack, borrarContratacion, editarContratacion, editarAnexo, listarContratacionPorId, listarPatrimonioBack, listarCategoriaPatrimonioBack, listarTipologiaPatrimonioBack, listarMaterialPatrimonioBack, listarEstadoPatrimonioBack, listarAutorPatrimonioBack, listarUbicacionPatrimonioBack, agregarPatrimonio, deshabilitarPatrimonio } = require("../controllers/adminControllers");
const fs = require('fs');
const router = Router();
const multer  = require('multer');
// Configurar multer para manejar la carga de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = `./pdf`; // Ruta de la carpeta de destino
            fs.mkdirSync(uploadPath, { recursive: true }); // Crear carpeta si no existe
            cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const { num_instrumento, expte } = req.body;
        const instrumento = num_instrumento.replace(/\//g, '-');
        const expediente = expte.replace(/\//g, '-');
        const nombreArchivo = `CONTRATACION_${instrumento}_EXPTE_${expediente}.pdf`;
        cb(null, nombreArchivo);
    }
});
const storageAnexo = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = `./pdf`; // Ruta de la carpeta de destino para los anexos
        fs.mkdirSync(uploadPath, { recursive: true }); // Crear carpeta si no existe
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const { num_instrumento, expte } = req.query;
        const instrumento = num_instrumento.replace(/\//g, '-');
        const expediente = expte.replace(/\//g, '-');
        const nombreArchivo = `CONTRATACION_${instrumento}_EXPTE_${expediente}_ANEXO.pdf`;
        cb(null, nombreArchivo);
    }
});
const storagePatrimonio = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = `./img-patrimonios`; // Ruta de la carpeta de destino para los anexos
        fs.mkdirSync(uploadPath, { recursive: true }); // Crear carpeta si no existe
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const { nombre_patrimonio } = req.body;
        const nombreArchivo = `${nombre_patrimonio}.pdf`;
        cb(null, nombreArchivo);
    }
});

const upload = multer({ storage: storage });
const uploadAnexo = multer({ storage: storageAnexo });
const uploadPatrimonio = multer({ storage: storagePatrimonio });

router.post("/altaOpcion", agregarOpcion);
router.post("/altaProceso", agregarProceso);
router.post("/borrarOpcion", borrarOpcion);

//--------Contrataciones-------------
router.get("/listaTipoContratacion", listarTipoContratacion);
router.get("/listarTipoIntrumentos", listarTipoInstrumento);
router.get("/listarContratacionBack", listarContratacionBack);
router.get("/listarContratacion", listarContratacion);
router.get("/listarContratacionPorId/:id", listarContratacionPorId);
router.post("/agregarContratacion", upload.single('archivo'),agregarContratacion);
router.post("/agregarAnexo", uploadAnexo.single('anexo'), agregarAnexo);
router.put("/editarContratacion", upload.single('archivo'), editarContratacion);
router.post("/editarAnexo", uploadAnexo.single('anexo'), editarAnexo);
router.post("/borrarContratacion", borrarContratacion);
//--------Contrataciones-------------

//--------Patrimonio Municipal ----------
router.get("/listarPatrimonio", listarPatrimonioBack);
router.get("/listarCategorias", listarCategoriaPatrimonioBack);
router.get("/listarTipologias", listarTipologiaPatrimonioBack);
router.get("/listarMateriales", listarMaterialPatrimonioBack);
router.get("/listarEstados", listarEstadoPatrimonioBack);
router.get("/listarAutores", listarAutorPatrimonioBack);
router.get("/listarUbicaciones", listarUbicacionPatrimonioBack);
router.post("/agregarPatrimonio", uploadPatrimonio.single('archivo'), agregarPatrimonio);
router.post("/deshabilitarPatrimonio", deshabilitarPatrimonio);

//--------Patrimonio Municipal ----------
module.exports = router;