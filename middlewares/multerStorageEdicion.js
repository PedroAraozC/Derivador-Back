const multer = require("multer");
const path = require("path");
const fs = require("fs");

const funcionMulterEdicion = () => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      if (file) {
        const uploadPath = path.join(__dirname, "..", "uploads", "boletin");
        fs.mkdirSync(uploadPath, { recursive: true });
         console.log("Destination:", uploadPath);
        cb(null, uploadPath);
      } else {
        cb(null, null);
      }
    },
    filename: function (req, file, cb) {
      if (!file) {
        cb(null, null);
      } else {
        const boletin = JSON.parse(req.body?.requestData);
         console.log("Boletín:", boletin);
        if (!boletin.nro_boletin || !boletin.fecha_publicacion) {
           console.log(boletin.nro_boletin, boletin.fecha_publicacion, "boletin");
          return cb(
            new Error("Falta información para construir el nombre del archivo")
          );
        }
        const nombreArchivo = `bol_${boletin.nro_boletin}_${boletin.fecha_publicacion}.pdf`;
         console.log("Nombre de archivo:", nombreArchivo);
        cb(null, nombreArchivo);
      }
    },
  });

  const upload = multer({ storage: storage });

  return (req, res, next) => {
    upload.single("archivoBoletin")(req, res, (err) => {
      if (req.file == null) {
        console.log("Boletin sin Archivo");
      } else {
        if (err instanceof multer.MulterError) {
          // Manejar errores de multer
          return res
            .status(400)
            .json({
              message: "Error al cargar el archivo",
              error: err.message,
            });
        } else if (err) {
          // Otros errores
          return res
            .status(500)
            .json({
              message: "Error interno del servidor",
              error: err.message,
            });
        }
      }
      // Si no hay errores, continuar con el siguiente middleware o controlador
      next();
    });
  };
};

module.exports = { funcionMulterEdicion };
