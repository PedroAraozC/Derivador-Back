const { Router } = require("express");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const express = require('express');
const uploadPath = '../tempUploads';
const pdfPath = '../pdf';
const app = express();
const router = Router();
const {agregarOpcion, borrarOpcion, agregarProceso, listarTipoContratacion, listarTipoInstrumento, agregarContratacion, agregarAnexo, listarContratacion, listarContratacionBack, borrarContratacion, editarContratacion, editarAnexo, listarContratacionPorId, listarPatrimonioBack, listarCategoriaPatrimonioBack, listarTipologiaPatrimonioBack, listarMaterialPatrimonioBack, listarEstadoPatrimonioBack, listarAutorPatrimonioBack, listarUbicacionPatrimonioBack, agregarPatrimonio, deshabilitarPatrimonio, agregarAutorPatrimonio, agregarEstadoPatrimonio, agregarMaterialPatrimonio, agregarTipologiaPatrimonio, agregarCategoriaPatrimonio, agregarUbicacionPatrimonio, editarPatrimonio, agregarGenero, editarGenero, listarGenero, listarTiposDeUsuario, agregarTipoDeUsuario, editarTipoDeUsuario, listarTipoDoc, agregarTipoDoc, editarTipoDoc, listarReparticion, agregarReparticion, editarReparticion, listarProcesos, actualizarPermisosTUsuario, listarPermisosPorTUsuarios, actualizarPermisosPorTUsuario, listarEmpleados, cambiarTipoDeUsuario, actualizarPermisosEspecificos, listarProcesosSinId, existeEnPermisosPersona, listarTareas, obtenerImagenes 
, editarPatrimonioImagenes} = require("../controllers/adminControllers");

// Configurar multer para manejar la carga de archivos (deberías incluir estas configuraciones también)

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración para guardar archivos temporalmente
// const upload1 = multer({
//   storage: multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, '../tempUploads');
//     },
//     filename: (req, file, cb) => {
//       cb(null, Date.now() + '-' + file.originalname);
//     }
//   })
// });

// Configuración de almacenamiento de Multer

if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
if (!fs.existsSync(pdfPath)) fs.mkdirSync(pdfPath);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath); // Usa la variable uploadPath
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const storagePatrimonio = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pdfPath);
  },
  filename: (req, file, cb) => {
    const { nombre_patrimonio } = req.body;
    if (!nombre_patrimonio) {
      return cb(new Error('nombre_patrimonio no está definido en el cuerpo de la solicitud'));
    }
    const finalName = nombre_patrimonio.replace(/\s+/g, '').trim();
    const nombreArchivo = `${finalName}.jpg`;
    cb(null, nombreArchivo);
  }
});

// Configuración de almacenamiento de anexos
const storageAnexo = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = `../pdf`; 
    fs.mkdirSync(uploadPath, { recursive: true });
cb(null, nombreArchivo);
  },
  filename: function (req, file, cb) {
    const { num_instrumento, expte } = req.query;
    const instrumento = num_instrumento.replace(/\//g, '-');
    const expediente = expte.replace(/\//g, '-');
    const nombreArchivo = `CONTRATACION_${instrumento}_EXPTE_${expediente}_ANEXO.pdf`;
    cb(null, nombreArchivo);
  }
});


const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1000000 } // Limite de tamaño de archivo
});
const uploadAnexo = multer({ storage: storageAnexo });
const uploadPatrimonio = multer({ 
  storage: storagePatrimonio,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes en formato JPEG o PNG'));
    }
  }
});

const parseMultipartFormData = (req, res, next) => {
  try {
    const uploadPath = path.join(__dirname, '../tempUploads');
    
    // Crear la carpeta si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.startsWith('multipart/form-data')) {
      return res.status(400).json({ message: 'Invalid Content-Type' });
    }

    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      return res.status(400).json({ message: 'Boundary not found' });
    }

    let rawData = Buffer.alloc(0);
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    
    req.on('data', chunk => {
      rawData = Buffer.concat([rawData, chunk]);
    });

    req.on('end', () => {
      let parts = [];
      let start = 0;
      let boundaryIndex = rawData.indexOf(boundaryBuffer);
      
      while (boundaryIndex !== -1) {
        parts.push(rawData.slice(start, boundaryIndex));
        start = boundaryIndex + boundaryBuffer.length;
        boundaryIndex = rawData.indexOf(boundaryBuffer, start);
      }

      req.files = {};
      req.body = {};

      parts.forEach(part => {
        const headerEndIndex = part.indexOf('\r\n\r\n');
        if (headerEndIndex === -1) return;

        const header = part.slice(0, headerEndIndex).toString();
        const body = part.slice(headerEndIndex + 4, part.length - 2); // Eliminar los CRLF al final

        const filenameMatch = header.match(/filename="(.+)"/);
        const fieldnameMatch = header.match(/name="(.+)"/);

        if (filenameMatch && fieldnameMatch) {
          const filename = filenameMatch[1];
          const fieldname = fieldnameMatch[1];
          const filePath = path.join(uploadPath, filename);

          fs.writeFileSync(filePath, body);
          req.files[fieldname] = { originalFilename: filename, filepath: filePath };
        } else if (fieldnameMatch) {
          const fieldname = fieldnameMatch[1];
          req.body[fieldname] = body.toString();
        }
      });

      next();
    });
  } catch (error) {
    next(error);
  }
};

// Controlador para subir y renombrar archivos
app.post('/admin/editarPatrimonioImagenes', parseMultipartFormData, (req, res) => {
  const { nombre_patrimonio } = req.body;
  const file = req.files['imagenCarrousel1']; // El archivo que recibiste

  if (!file || !nombre_patrimonio) {
    return res.status(400).json({ message: 'Missing file or nombre_patrimonio' });
  }

  // Renombrar el archivo con el nombre del patrimonio
  const extension = path.extname(file.originalFilename); // Obtener la extensión
  const newFileName = `${nombre_patrimonio}${extension}`;
  const newPath = path.join(__dirname, 'uploads', newFileName);

  // Mover el archivo a su nueva ubicación con el nombre modificado
  fs.rename(file.filepath, newPath, (err) => {
    if (err) {
      return res.status(500).send('Error al renombrar el archivo');
    }
    res.send('Archivo subido y renombrado correctamente');
  });
});


router.post("/altaOpcion", agregarOpcion);
router.post("/altaProceso", agregarProceso);
router.post("/borrarOpcion", borrarOpcion);
router.post("/listarPermisosPorTUsuarios", listarPermisosPorTUsuarios);
router.post("/editarPermisosPorTUsuarios", actualizarPermisosPorTUsuario);

router.post("/altaGenero", agregarGenero);
router.post("/editarGenero", editarGenero);
router.get("/listarGenero", listarGenero);

//-----------Usurios-------------

router.get("/listarEmpleados", listarEmpleados);
router.get("/listarProcesosSinId", listarProcesosSinId);
router.post("/cambiarTipoDeUsuario", cambiarTipoDeUsuario);
router.post("/establecerPermisosEspecificos", actualizarPermisosEspecificos);
router.post("/existeEnPermisosPersona", existeEnPermisosPersona);

//-----------Usurios-------------


//-----------Tipo de Usurios-------------

router.get("/listarTUsuarios", listarTiposDeUsuario);
router.post("/listarProcesos", listarProcesos);
router.post("/altaTUsuarios", agregarTipoDeUsuario);
router.post("/editarTUsuarios", editarTipoDeUsuario);
router.post("/editarPermisosTUsuarios", actualizarPermisosTUsuario);


//-----------Tipo de Usurios-------------

//-----------Tipo de Documento-------------

router.get("/listarTDocumentos", listarTipoDoc);
router.post("/altaTDocumentos", agregarTipoDoc);
router.post("/editarTDocumentos", editarTipoDoc);

//-----------Tipo de Documento-------------


//-----------Reparticiones-------------

router.get("/listarReparticiones", listarReparticion);
router.post("/altaReparticiones", agregarReparticion);
router.post("/editarReparticiones", editarReparticion);

//-----------Reparticiones-------------

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
router.get("/obtenerImagenes", obtenerImagenes);
router.post("/agregarPatrimonio", uploadPatrimonio.single('archivo'), agregarPatrimonio);
router.post("/editarPatrimonio", editarPatrimonio);
router.post('/editarPatrimonioImagenes', parseMultipartFormData, editarPatrimonioImagenes);

router.post("/agregarAutor", agregarAutorPatrimonio);
router.post("/agregarEstado", agregarEstadoPatrimonio);
router.post("/agregarMaterial", agregarMaterialPatrimonio);
router.post("/agregarTipologia", agregarTipologiaPatrimonio);
router.post("/agregarCategoria", agregarCategoriaPatrimonio);
router.post("/agregarUbicacion", agregarUbicacionPatrimonio);
router.post("/deshabilitarPatrimonio", deshabilitarPatrimonio);

//--------Patrimonio Municipal ----------

module.exports = router;