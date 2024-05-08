const { conectarBDEstadisticasMySql } = require("../config/dbEstadisticasMYSQL");
const { conectarSMTContratacion } = require("../config/dbEstadisticasMYSQL");
const { sequelize_ciu_digital_derivador } = require("../config/sequelize");
const Proceso = require("../models/Derivador/Proceso");
const PermisoTUsuario = require("../models/Derivador/PermisoTUsuario");
const PermisoPersona = require("../models/Derivador/PermisoPersona");
const fs = require('fs');
const path = require('path');

const sobrescribirArchivo = (rutaArchivoAntiguo, rutaArchivoNuevo) => {
  try {
    // Leer el contenido del nuevo archivo
    const contenidoNuevo = fs.readFileSync(rutaArchivoNuevo);
    // Sobrescribir el archivo antiguo con el contenido del nuevo archivo
    fs.writeFileSync(rutaArchivoAntiguo, contenidoNuevo);
    console.log(`Archivo sobrescrito: ${rutaArchivoAntiguo}`);
  } catch (error) {
    console.error(`Error al sobrescribir el archivo: ${error}`);
  }
};
// Función para obtener la ruta del archivo antiguo
const obtenerRutaArchivoAntiguo = (oldName) => {
  // Suponiendo que los archivos antiguos se guardan en una carpeta llamada 'pdfs' en el escritorio
  const rutaArchivoAntiguo = path.join('C:/Users/Tobias/Desktop', oldName);
  console.log(rutaArchivoAntiguo)
  return rutaArchivoAntiguo;
};

// Función para obtener la ruta del nuevo archivo
const obtenerRutaArchivoNuevo = (nombre_archivo) => {
  // Suponiendo que los archivos nuevos también se guardan en una carpeta llamada 'pdfs' en el escritorio
  const rutaArchivoNuevo = path.join('C:/Users/Tobias/Desktop', nombre_archivo);
  return rutaArchivoNuevo;
};

const agregarOpcion = async (req, res) => {
    try {
      const { nombre_opcion, habilita } = req.body;
  
      // Verificar que los valores requeridos estén definidos
      if (nombre_opcion === undefined || habilita === undefined) {
        throw new Error("Los parámetros de la solicitud son inválidos");
      }
  
      // Query para insertar una nueva opción
      const sql = "INSERT INTO opcion (nombre_opcion, habilita) VALUES (?, ?)";
      const values = [nombre_opcion, habilita];
  
      // Ejecutar la consulta SQL para insertar la nueva opción
      const connection = await conectarBDEstadisticasMySql();
      const [result] = await connection.execute(sql, values);
      const nuevoId = result.insertId; // Obtener el id generado por la base de datos
  
      res.status(201).json({ id: nuevoId, message: "Opción creada con éxito" });
    } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
  };

const agregarProceso = async (req, res) => {
    let transaction;
    console.log(req.body)
    try {
      const { nombre_proceso, habilita, descripcion, id_opcion } = req.body;
      // Verificar que los valores requeridos estén definidos
      if (nombre_proceso === undefined || habilita === undefined || descripcion === undefined || id_opcion === undefined) {
        throw new Error("Los parámetros de la solicitud son inválidos");
      }
      // Iniciar una transacción
      transaction = await sequelize_ciu_digital_derivador.transaction();
      const connection = await conectarBDEstadisticasMySql();
  
      // Obtener la lista de tipos de usuario
      const [tiposUsuario, fieldsTiposUsuario] = await connection.execute(
        "SELECT id_tusuario FROM tipo_usuario"
      );
      // Obtener la lista de tipos de usuario
      const [cantidadPersonas, fieldsCantidadPersonas] = await connection.execute(
        "SELECT id_persona FROM persona"
      );
      // Crear el nuevo proceso en la base de datos dentro de la transacción
      const nuevoProceso = await Proceso.create(
        {
          nombre_proceso,
          descripcion,
          id_opcion,
          habilita
        },
        { transaction }
      );

      const id_procesoNuevo = nuevoProceso.id_proceso;

      // Iterar sobre cada tipo de usuario y realizar el insert
      for (const tipoUsuario of tiposUsuario) {
        const id_tusuario = tipoUsuario.id_tusuario;
        
        const nuevoPermisoTUsuario = await PermisoTUsuario.create(
          {
            id_proceso: id_procesoNuevo,
            id_tusuario,
          },
          { transaction }
        );
      }
      
      // Iterar sobre cada tipo de usuario y realizar el insert
      for (const persona of cantidadPersonas) {
        const id_persona = persona.id_persona;
      
        const nuevoPermisoPersona = await PermisoPersona.create(
          {
            id_proceso: id_procesoNuevo,
            id_persona,
          },
          { transaction }
        );
      }
      
      // Commit de la transacción si todas las operaciones fueron exitosas
      await transaction.commit();
  
      // Responder con el ID del nuevo proceso creado
      res.status(201).json({ id: nuevoProceso.id, message: "Proceso creado con éxito" });
    } catch (error) {
      // Rollback de la transacción en caso de error
      if (transaction) await transaction.rollback();
  
      // Responder con un mensaje de error
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
  };


// const editarConvocatoria = async (req, res) => {
//   try {
//     const { id, nivel, cargo, establecimiento, causal, expte, caracter, fecha, hora, archivo, habilita } = req.body;

//     // Query para actualizar la convocatoria
//     const sql = "UPDATE convocatoria SET id_nivel = ?, cargo = ?, id_establecimiento = ?, id_causal = ?, expte = ?, id_caracter = ?, fecha_designa = ?, hora_designa = ?,nombre_archivo = ?, habilita = ? WHERE id_convoca = ?";
//     const values = [nivel, cargo, establecimiento, causal, expte, caracter, fecha, hora, archivo, habilita, id];

//     // Verificar si la convocatoria ya existe con otra ID
//     const connection = await conectar_BD_EDUCACION_MySql();
//     const [convocatoria] = await connection.execute(
//       "SELECT * FROM convocatoria WHERE (cargo = ? AND id_establecimiento = ? AND id_causal = ? AND expte = ? AND id_caracter = ? AND fecha_designa = ? AND hora_designa = ? AND nombre_archivo = ? AND habilita = ?) AND id_convoca != ?",
//       [cargo, establecimiento, causal, expte, caracter, fecha, hora, archivo, habilita, id]
//     );

//     if (convocatoria.length === 0) {
//       // No existe otra convocatoria con los mismos datos, se puede proceder con la actualización
//       const [result] = await connection.execute(sql, values);
//       console.log("Filas actualizadas:", result.affectedRows);
//       res.status(200).json({ message: "Convocatoria modificada con éxito", result });
//     } else {
//       // Ya existe otra convocatoria con los mismos datos, devolver un error
//       res.status(400).json({
//         message: "Ya existe una convocatoria con los mismos datos",
//         convocatoria: convocatoria[0],
//       });
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message || "Algo salió mal :(" });
//   }
// };

const borrarOpcion = async (req, res) => {
  const { id } = req.body;
  const sql = "UPDATE opcion set habilita = 0 WHERE id_opcion = ?";
  const values = [id];

  try {
    const connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values); 
    await connection.end();
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "opción deshabilitada con éxito" });
    } else {
      res.status(400).json({ message: "opción no encontrada" });
    }
  } catch (error) {
    console.error("Error al eliminar la opción:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};


//-----------CONTRATACIONES--------------
const listarTipoContratacion = async (req, res) => {
  const connection = await conectarSMTContratacion();
  try {
    const [contrataciones] = await connection.execute(
      'SELECT * FROM tipo_contratacion WHERE habilita = 1'
    );
    connection.end();
    res.status(200).json({ contrataciones })

  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}
const listarContratacionPorId = async (req, res) => {
  const { id } = req.params; 
  console.log(id)
  const sql = "SELECT * FROM contratacion WHERE id_contratacion = ?";
  const values = [id];
  try {
    const connection = await conectarSMTContratacion();
    const [contratacion] = await connection.execute(sql, values); 
    await connection.end();
    if (contratacion.length > 0) { 
      res.status(200).json({ contratacion });
    } else {
      res.status(400).json({ message: "No se encontró la contratación" });
    }

  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}
const listarTipoInstrumento = async (req, res) => {
  const connection = await conectarSMTContratacion();
  try {
    const [instrumentos] = await connection.execute(
      'SELECT * FROM tipo_instrumento WHERE habilita = 1'
    );
    connection.end();
    res.status(200).json({ instrumentos })

  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const listarContratacionBack = async (req, res) => {
  const connection = await conectarSMTContratacion();
  try {
    const [contrataciones] = await connection.execute(
      'SELECT * FROM contratacion'
    );

    contrataciones.reverse();
    connection.end();
    res.status(200).json({ contrataciones })

  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const listarContratacion = async (req, res) => {
  const connection = await conectarSMTContratacion();
  try {
    const [contrataciones] = await connection.execute(
      'SELECT * FROM contratacion WHERE habilita = 1'
    );

    contrataciones.reverse();
    connection.end();
    res.status(200).json({ contrataciones })

  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const agregarContratacion = async (req, res) => {
  try {
    const {
      fecha_apertura,
      hora_apertura,
      fecha_presentacion,
      hora_presentacion,
      nombre_contratacion,
      id_tcontratacion,
      num_instrumento,
      id_tinstrumento,
      expte,
      valor_pliego,
      detalle,
      habilita
    } = req.body;

    const archivo = req.file;

    if (!archivo) {
      return res.status(400).json({ message: "Por favor, adjunta un archivo" });
    }

    // Obtener el nombre del archivo cargado
    const nombre_archivo = archivo.originalname;
    
    // Obtener el último id_contratacion de la tabla
    const connection = await conectarSMTContratacion();
    const [lastIdResult] = await connection.query("SELECT MAX(id_contratacion) AS max_id FROM contratacion");
    let nextId = lastIdResult[0].max_id + 1; // Generar el próximo id_contratacion
    // Query para insertar una nueva convocatoria
    const sql =
      "INSERT INTO contratacion (id_contratacion, fecha_apertura, hora_apertura, fecha_presentacion, hora_presentacion, nombre_contratacion, id_tcontratacion, num_instrumento, id_tinstrumento, expte, valor_pliego, habilita, nombre_archivo, detalle) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const values = [
      nextId,
      fecha_apertura,
      hora_apertura,
      fecha_presentacion,
      hora_presentacion,
      nombre_contratacion,
      id_tcontratacion,
      num_instrumento,
      id_tinstrumento,
      expte,
      valor_pliego,
      habilita,
      nombre_archivo,
      detalle
    ];
    console.log(values)
    // Ejecutar la consulta SQL para insertar la nueva convocatoria
    await connection.execute(sql, values);

    res.status(201).json({ message: "Convocatoria creada con éxito", id: nextId, num_contratacion: nextId });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const borrarContratacion = async (req, res) => {
  const { id } = req.body;
  const sql = "UPDATE contratacion set habilita = 0 WHERE id_contratacion = ?";
  const values = [id];

  try {
    const connection = await conectarSMTContratacion();
    const [result] = await connection.execute(sql, values); 
    await connection.end();
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Contratación deshabilitada con éxito" });
    } else {
      res.status(400).json({ message: "Contratación no encontrada" });
    }
  } catch (error) {
    console.error("Error al eliminar la contratación:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const editarContratacion = async (req, res) => {
  try {
    const { id, nombre_contratacion, id_tcontratacion, fecha_presentacion, hora_presentacion, num_instrumento, valor_pliego, expte, id_tinstrumento, fecha_apertura, hora_apertura, habilita, oldName, detalle } = req.body;
    // Verificar si hay un archivo adjunto
    const archivo = req.file;
    let nombre_archivo = null;
    if (archivo) {
      nombre_archivo = `CONTRATACION_${num_instrumento}_EXPTE_${expte}.pdf`;
      console.log(req.body)
      // Sobrescribir el archivo físico en el sistema de archivos si es necesario
      const rutaArchivoAntiguo = obtenerRutaArchivoAntiguo(oldName); // Define esta función para obtener la ruta del archivo antiguo
      const rutaArchivoNuevo = obtenerRutaArchivoNuevo(nombre_archivo); // Define esta función para obtener la ruta del archivo nuevo
      sobrescribirArchivo(rutaArchivoAntiguo, rutaArchivoNuevo); // Define esta función para sobrescribir el archivo físico
    }
    // Query para actualizar la contratacion
    const sql = "UPDATE contratacion SET nombre_contratacion = ?, id_tcontratacion = ?, fecha_presentacion = ?, hora_presentacion = ?, num_instrumento = ?, valor_pliego = ?, expte = ?, id_tinstrumento = ?, fecha_apertura = ?, hora_apertura = ?, habilita = ?, nombre_archivo = ?, detalle = ? WHERE id_contratacion = ?";
    const values = [nombre_contratacion, id_tcontratacion, fecha_presentacion, hora_presentacion, num_instrumento, valor_pliego, expte, id_tinstrumento, fecha_apertura, hora_apertura, habilita, nombre_archivo, detalle, id];
    console.log(values)
    // Verificar si la contratacion ya existe con otra ID
    const connection = await conectarSMTContratacion();
    const [contratacion] = await connection.execute(
      "SELECT * FROM contratacion WHERE (nombre_contratacion = ? AND id_tcontratacion = ? AND num_instrumento = ? AND valor_pliego = ? AND expte = ? AND habilita = ?) AND id_contratacion != ?",
      [nombre_contratacion,id_tcontratacion, num_instrumento, valor_pliego, expte, habilita, id ]
    );

    if (contratacion.length === 0) {
      // No existe otra contratacion con los mismos datos, se puede proceder con la actualización
      const [result] = await connection.execute(sql, values);
      console.log("Filas actualizadas:", result.affectedRows);
      res.status(200).json({ message: "Contratacion modificada con éxito", result });
    } else {
      // Ya existe otra contratacion con los mismos datos, devolver un error
      res.status(400).json({
        message: "Ya existe una contratacion con los mismos datos",
        contratacion: contratacion[0],
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};
//-----------CONTRATACIONES--------------


module.exports={ agregarOpcion, borrarOpcion, agregarProceso, listarTipoContratacion, listarTipoInstrumento, agregarContratacion, listarContratacionBack, borrarContratacion, editarContratacion, listarContratacion, listarContratacionPorId}