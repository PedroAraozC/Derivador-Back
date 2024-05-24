const { conectarBDEstadisticasMySql, conectarSMTPatrimonio } = require("../config/dbEstadisticasMYSQL");
const { conectarSMTContratacion } = require("../config/dbEstadisticasMYSQL");
const { sequelize_ciu_digital_derivador } = require("../config/sequelize");
const Proceso = require("../models/Derivador/Proceso");
const PermisoTUsuario = require("../models/Derivador/PermisoTUsuario");
const PermisoPersona = require("../models/Derivador/PermisoPersona");
const fs = require('fs');
const path = require('path');
const { conectarFTPCiudadano } = require("../config/winscpCiudadano");

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
  const rutaArchivoAntiguo = path.join('./pdf', oldName);
  console.log(rutaArchivoAntiguo)
  return rutaArchivoAntiguo;
};

// Función para obtener la ruta del nuevo archivo
const obtenerRutaArchivoNuevo = (nombre_archivo) => {
  // Suponiendo que los archivos nuevos también se guardan en una carpeta llamada 'pdfs' en el escritorio
  const rutaArchivoNuevo = path.join('./pdf', nombre_archivo);
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
    const nombre_archivo = archivo.filename;
    const detalleValorPorDefecto = ''; // Puedes cambiar esto por cualquier otro valor por defecto que desees
    const detalleFinal = detalle ?? detalleValorPorDefecto;
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
      detalleFinal
    ];
    console.log(values)
    // Ejecutar la consulta SQL para insertar la nueva convocatoria
    await connection.execute(sql, values);
    const ftpClient = await conectarFTPCiudadano();
    const remoteFilePath = `/PDF-Convocatorias/${nombre_archivo}`;
    const localFilePath = path.join("./pdf", nombre_archivo);
    // Subir la imagen al servidor FTP
    await ftpClient.uploadFrom(localFilePath, remoteFilePath);

    // Eliminar la imagen local después de subirla
    fs.unlinkSync(localFilePath);
    await ftpClient.close();
    res.status(201).json({ message: "Convocatoria creada con éxito", id: nextId, num_contratacion: nextId });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const agregarAnexo = async (req, res) => {
  try {

    const archivo = req.file;

    if (!archivo) {
      return res.status(400).json({ message: "Por favor, adjunta un archivo" });
    }

    // Obtener el nombre del archivo cargado
    const nombre_anexo = archivo.filename;
    
    // Obtener el último id_contratacion de la tabla
    const connection = await conectarSMTContratacion();
    const [lastIdResult] = await connection.query("SELECT MAX(id_contratacion) AS max_id FROM contratacion");
    let maxId = lastIdResult[0].max_id;
    // Query para insertar una nueva convocatoria
    const sql = "UPDATE contratacion SET `nombre_anexo`= ? WHERE `id_contratacion`= ?";
    const values = [
      nombre_anexo,
      maxId
    ];
    console.log(values)
    // Ejecutar la consulta SQL para insertar la nueva convocatoria
    await connection.execute(sql, values);
    const ftpClient = await conectarFTPCiudadano();
    const remoteFilePath = `/PDF-Convocatorias/${nombre_anexo}`;
    const localFilePath = path.join("./pdf", nombre_anexo);
    // Subir la imagen al servidor FTP
    await ftpClient.uploadFrom(localFilePath, remoteFilePath);

    // Eliminar la imagen local después de subirla
    fs.unlinkSync(localFilePath);
    await ftpClient.close();
    res.status(201).json({ message: "Anexo agregado con éxito"});
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const editarAnexo = async (req, res) => {
  try {
    const {id, oldName, num_instrumento, expte} = req.query
    console.log(req.query)
    const archivo = req.file;
    let nombre_anexo = null;
    if (archivo) {
      const instrumento = num_instrumento.replace(/\//g, '-');
      const expediente = expte.replace(/\//g, '-');
      let nombreViejo = oldName.replace(/\//g, '-')
      nombre_anexo = `CONTRATACION_${instrumento}_EXPTE_${expediente}_ANEXO.pdf`;
      // const rutaArchivoAntiguo = obtenerRutaArchivoAntiguo(oldName);
      // const rutaArchivoNuevo = obtenerRutaArchivoNuevo(nombre_anexo); 
      // sobrescribirArchivo(rutaArchivoAntiguo, rutaArchivoNuevo); 
      const ftpClient = await conectarFTPCiudadano();
      const localFilePath = path.join("./pdf", nombre_anexo);
      const remoteFilePath = `/PDF-Convocatorias/${nombre_anexo}`;
      await ftpClient.remove(`/PDF-Convocatorias/${nombreViejo}`)
      // Subir la imagen al servidor FTP
      await ftpClient.uploadFrom(localFilePath, remoteFilePath);

      // Eliminar la imagen local después de subirla
      fs.unlinkSync(localFilePath);
      await ftpClient.close();
    }
    // Query para actualizar la contratacion
    const sql = "UPDATE contratacion SET `nombre_anexo`= ? WHERE `id_contratacion`= ?";
    const values = [nombre_anexo, id];
    // Verificar si la contratacion ya existe con otra ID
    const connection = await conectarSMTContratacion();
    await connection.execute(sql, values);
    
    res.status(201).json({ message: "Anexo editado con éxito"});
    connection.end();
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const borrarContratacion = async (req, res) => {
  const { id } = req.body;
  console.log(req.body)
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
    console.log(req.body)
    const archivo = req.file;
    let nombre_archivo = null;
    nombre_archivo = `CONTRATACION_${num_instrumento}_EXPTE_${expte}.pdf`;
    if (archivo) {
      let nombreViejo = oldName.replace(/\//g, '-')
      let archivoViejo = nombre_archivo.replace(/\//g, '-')
      console.log(nombreViejo)
      const ftpClient = await conectarFTPCiudadano();
      const localFilePath = path.join("./pdf", archivoViejo);
      const remoteFilePath = `/PDF-Convocatorias/${archivoViejo}`;
      await ftpClient.remove(`/PDF-Convocatorias/${nombreViejo}`)
      // Subir la imagen al servidor FTP
      await ftpClient.uploadFrom(localFilePath, remoteFilePath);

      // Eliminar la imagen local después de subirla
      fs.unlinkSync(localFilePath);
      await ftpClient.close();
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
    connection.end();
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};
//-----------CONTRATACIONES--------------




//-----------PATRIMOINIO MUNICIPAL--------------

const agregarCategoriaPatrimonio = async (req, res) => {
  try {
    const { nombre_categoria, habilita } = req.body;

    // Verificar que los valores requeridos estén definidos
    if (nombre_categoria === undefined || habilita === undefined) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }

    // Query para insertar una nueva categoria
    const sql = "INSERT INTO categoria (nombre_categoria, habilita) VALUES (?, ?)";
    const values = [nombre_categoria, habilita];

    // Ejecutar la consulta SQL para insertar la nueva opción
    const connection = await conectarSMTPatrimonio();
    const [result] = await connection.execute(sql, values);
    const nuevoId = result.insertId; // Obtener el id generado por la base de datos

    res.status(201).json({ id: nuevoId, message: "Categoria creada con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const agregarTipologiaPatrimonio = async (req, res) => {
  try {
    const { nombre_tipologia, habilita } = req.body;

    // Verificar que los valores requeridos estén definidos
    if (nombre_tipologia === undefined || habilita === undefined) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }

    // Query para insertar una nueva tipologia
    const sql = "INSERT INTO tipologia (nombre_tipologia, habilita) VALUES (?, ?)";
    const values = [nombre_tipologia, habilita];

    // Ejecutar la consulta SQL para insertar la nueva opción
    const connection = await conectarSMTPatrimonio();
    const [result] = await connection.execute(sql, values);
    const nuevoId = result.insertId; // Obtener el id generado por la base de datos

    res.status(201).json({ id: nuevoId, message: "Tipología creada con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const agregarMaterialPatrimonio = async (req, res) => {
  try {
    const { nombre_material, habilita } = req.body;

    // Verificar que los valores requeridos estén definidos
    if (nombre_material === undefined || habilita === undefined) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }

    // Query para insertar una nueva tipologia
    const sql = "INSERT INTO material (nombre_material, habilita) VALUES (?, ?)";
    const values = [nombre_material, habilita];

    // Ejecutar la consulta SQL para insertar la nueva opción
    const connection = await conectarSMTPatrimonio();
    const [result] = await connection.execute(sql, values);
    const nuevoId = result.insertId; // Obtener el id generado por la base de datos

    res.status(201).json({ id: nuevoId, message: "Material creado con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const agregarEstadoPatrimonio = async (req, res) => {
  try {
    const { nombre_estado, habilita } = req.body;

    // Verificar que los valores requeridos estén definidos
    if (nombre_estado === undefined || habilita === undefined) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }

    // Query para insertar una nuevo estado
    const sql = "INSERT INTO estado (nombre_estado, habilita) VALUES (?, ?)";
    const values = [nombre_estado, habilita];

    // Ejecutar la consulta SQL para insertar la nueva opción
    const connection = await conectarSMTPatrimonio();
    const [result] = await connection.execute(sql, values);
    const nuevoId = result.insertId; // Obtener el id generado por la base de datos

    res.status(201).json({ id: nuevoId, message: "Estado creado con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const agregarAutorPatrimonio = async (req, res) => {
  try {
    const { nombre_autor, descripcion_autor, habilita } = req.body;

    // Verificar que los valores requeridos estén definidos
    if (nombre_autor === undefined || descripcion_autor === undefined || habilita === undefined) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }

    // Query para insertar una nuevo estado
    const sql = "INSERT INTO autor (nombre_autor, descripcion_autor, habilita) VALUES (?, ?, ?)";
    const values = [nombre_autor, descripcion_autor, habilita];

    // Ejecutar la consulta SQL para insertar el nuevo autor
    const connection = await conectarSMTPatrimonio();
    const [result] = await connection.execute(sql, values);
    const nuevoId = result.insertId; // Obtener el id generado por la base de datos

    res.status(201).json({ id: nuevoId, message: "Autor creado con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};
const agregarUbicacionPatrimonio = async (req, res) => {
  try {
    const { nombre_ubicacion, habilita } = req.body;

    // Verificar que los valores requeridos estén definidos
    if (nombre_ubicacion === undefined || habilita === undefined) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }

    // Query para insertar una nuevo estado
    const sql = "INSERT INTO ubicacion (nombre_ubicacion, habilita) VALUES (?, ?, ?)";
    const values = [nombre_ubicacion, habilita];

    // Ejecutar la consulta SQL para insertar el nuevo autor
    const connection = await conectarSMTPatrimonio();
    const [result] = await connection.execute(sql, values);
    const nuevoId = result.insertId; // Obtener el id generado por la base de datos

    res.status(201).json({ id: nuevoId, message: "Autor creado con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

//-----------PATRIMOINIO MUNICIPAL--------------



module.exports={ agregarOpcion, borrarOpcion, agregarProceso, listarTipoContratacion, listarTipoInstrumento, agregarContratacion, agregarAnexo, listarContratacionBack, borrarContratacion, editarContratacion, listarContratacion, editarAnexo, listarContratacionPorId}