const { conectarBDEstadisticasMySql, conectarSMTPatrimonio } = require("../config/dbEstadisticasMYSQL");
const { conectarSMTContratacion } = require("../config/dbEstadisticasMYSQL");
const { sequelize_ciu_digital_derivador } = require("../config/sequelize");
const Proceso = require("../models/Derivador/Proceso");
const PermisoTUsuario = require("../models/Derivador/PermisoTUsuario");
const PermisoPersona = require("../models/Derivador/PermisoPersona");
const fs = require('fs');
const path = require('path');
const { conectarFTPCiudadano } = require("../config/winscpCiudadano");



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

// --------------------PANEL PARA GENERO DERIVADOR----------------------

const agregarGenero = async (req, res) =>{
  try {
    const { nombre_genero, habilita } = req.body;
    
    // Verificar que los valores requeridos estén definidos
    if (nombre_genero === undefined || habilita === undefined) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }

    // Query para insertar una nuevo genero
    const sql = "INSERT INTO genero (nombre_genero, habilita) VALUES (?, ?)";
    const values = [nombre_genero, habilita];

    // Ejecutar la consulta SQL para insertar la nueva opción
    const connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values);
    const nuevoId = result.insertId; // Obtener el id generado por la base de datos

    res.status(201).json({ id: nuevoId, message: "Tipología creada con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const editarGenero = async (req, res) =>{
  const { id, nombre_genero, habilita } = req.body;
  const sql = "UPDATE genero set habilita = ?, nombre_genero = ? WHERE id_genero = ?";
  const values = [habilita, nombre_genero, id];

  try {
    const connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values); 
    await connection.end();
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Genero editado con éxito" });
    } else {
      res.status(400).json({ message: "Genero no encontrado" });
    }
  } catch (error) {
    console.error("Error al editar el genero:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const listarGenero = async (req, res) => {
  const connection = await conectarBDEstadisticasMySql();
  try {
    const [generos] = await connection.execute(
      'SELECT * FROM genero'
    );
    connection.end();
    res.status(200).json({ generos })

  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

// --------------------PANEL PARA GENERO DERIVADOR----------------------



// --------------------PANEL PARA TIPO DOCUMENTO DERIVADOR----------------------

const agregarTipoDoc = async (req, res) =>{
  try {
    const { nombre_tdocumento, habilita } = req.body;
    
    // Verificar que los valores requeridos estén definidos
    if (nombre_tdocumento === undefined || habilita === undefined) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }

    // Query para insertar una nuevo genero
    const sql = "INSERT INTO tipo_documento (nombre_tdocumento, habilita) VALUES (?, ?)";
    const values = [nombre_tdocumento, habilita];

    // Ejecutar la consulta SQL para insertar la nueva opción
    const connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values);
    const nuevoId = result.insertId; // Obtener el id generado por la base de datos

    res.status(201).json({ id: nuevoId, message: "Tipo Documento creado con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}
const editarTipoDoc = async (req, res) =>{
  const { id, nombre_tdocumento, habilita } = req.body;
  const sql = "UPDATE genero set habilita = ?, nombre_tdocumento = ? WHERE id_tdocumento = ?";
  const values = [habilita, nombre_tdocumento, id];

  try {
    const connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values); 
    await connection.end();
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Tipo documento editado con éxito" });
    } else {
      res.status(400).json({ message: "Tipo documento no encontrado" });
    }
  } catch (error) {
    console.error("Error al editar el Tipo documento:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}
const listarTipoDoc = async (req, res) => {
  const connection = await conectarBDEstadisticasMySql();
  try {
    const [tdocumentos] = await connection.execute(
      'SELECT * FROM tipo_documento'
    );
    connection.end();
    res.status(200).json({ tdocumentos })

  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

// --------------------PANEL PARA TIPO DOCUMENTO DERIVADOR----------------------



// --------------------PANEL PARA REPARTICIONES ----------------------

const agregarReparticion = async (req, res) =>{
  try {
    const { item, nombre_reparticion, depende, secretaria, vigente_desde, vigente_hasta, habilita } = req.body;
    
    // Verificar que los valores requeridos estén definidos
    if (item === undefined || nombre_reparticion === undefined || depende === undefined || secretaria === undefined || vigente_desde === undefined || vigente_hasta === undefined ||habilita === undefined) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }

    // Query para insertar una nuevo genero
    const sql = "INSERT INTO reparticion (item, nombre_reparticion, depende, secretaria, vigente_desde, vigente_hasta, habilita) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const values = [item, nombre_reparticion, depende, secretaria, vigente_desde, vigente_hasta, habilita];

    // Ejecutar la consulta SQL para insertar la nueva opción
    const connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values);
    const nuevoId = result.insertId; // Obtener el id generado por la base de datos

    res.status(201).json({ id: nuevoId, message: "Repartición creada con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}
const editarReparticion = async (req, res) =>{
  const { id, item, nombre_reparticion, depende, secretaria, vigente_desde, vigente_hasta, habilita } = req.body;
  const sql = "UPDATE reparticion set item = ?, nombre_reparticion = ?, depende = ?, secretaria = ?, vigente_desde = ?, vigente_hasta = ?, habilita = ? WHERE id_reparticion = ?";
  const values = [item, nombre_reparticion, depende, secretaria, vigente_desde, vigente_hasta, habilita, id];

  try {
    const connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values); 
    await connection.end();
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Repartición editada con éxito" });
    } else {
      res.status(400).json({ message: "Repartición no encontrada" });
    }
  } catch (error) {
    console.error("Error al editar la Repartición:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}
const listarReparticion = async (req, res) => {
  const connection = await conectarBDEstadisticasMySql();
  try {
    const [reparticiones] = await connection.execute(
      'SELECT * FROM reparticion'
    );
    connection.end();
    res.status(200).json({ reparticiones })

  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

// --------------------PANEL PARA REPARTICIONES ----------------------



// --------------------PANEL PARA TIPO DE USUARIO DERIVADOR----------------------

const agregarTipoDeUsuario = async (req, res) =>{
  try {
    const { nombre_tusuario, observacion, habilita } = req.body;
    
    // Verificar que los valores requeridos estén definidos
    if (nombre_tusuario === undefined || observacion === undefined || habilita === undefined) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }

    // Query para insertar una nuevo tipo de usuario
    const sql = "INSERT INTO tipo_usuario (nombre_tusuario, observacion, habilita) VALUES (?, ?, ?)";
    const values = [nombre_tusuario, observacion, habilita];

    // Ejecutar la consulta SQL para insertar la nueva opción
    const connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values);
    const nuevoId = result.insertId; // Obtener el id generado por la base de datos

    res.status(201).json({ id: nuevoId, message: "Tipo de usuario creado con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const listarTiposDeUsuario = async (req, res) => {
  const connection = await conectarBDEstadisticasMySql();
  try {
    const [tusuarios] = await connection.execute(
      'SELECT * FROM tipo_usuario'
    );
    connection.end();
    res.status(200).json({ tusuarios })

  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const editarTipoDeUsuario = async (req, res) =>{

  const { id, nombre_tusuario, observacion, habilita } = req.body;
  const sql = "UPDATE tipo_usuario set habilita = ?, nombre_tusuario = ? , observacion = ? WHERE id_tusuario = ?";
  const values = [habilita, nombre_tusuario, observacion, id];

  try {
    const connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values); 
    await connection.end();
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Tipo de usuario editado con éxito" });
    } else {
      res.status(400).json({ message: "Tipo de usuario no encontrado" });
    }
  } catch (error) {
    console.error("Error al editar el Tipo de usuario:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

// --------------------PANEL PARA TIPO DE USUARIO DERIVADOR----------------------


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

    // Ejecutar la consulta SQL para insertar la nueva convocatoria
    await connection.execute(sql, values);
    
    // const ftpClient = await conectarFTPLICITACIONES();
    // const remoteFilePath = `/var/www/vhosts/licitaciones.smt.gob.ar/PDF-Convocatorias/${nombre_archivo}`;
    // const localFilePath = path.join("./pdf", nombre_archivo);
    // Subir la imagen al servidor FTP
    // await ftpClient.uploadFrom(localFilePath, remoteFilePath);

    // Eliminar la imagen local después de subirla
    // fs.unlinkSync(localFilePath);
    // await ftpClient.close();

    // Define las rutas de origen y destino
    const archivoOrigen = path.join(__dirname, '..', 'pdf', nombre_archivo);
    const archivoDestino = path.join(__dirname, '..', '..', 'httpdocs', 'PDF-Convocatorias', nombre_archivo);

    // Verifica si la carpeta destino existe, de lo contrario, créala
    const carpetaDestino = path.dirname(archivoDestino);
    if (!fs.existsSync(carpetaDestino)) {
      fs.mkdirSync(carpetaDestino, { recursive: true });
    }

    // Mueve el archivo
    fs.rename(archivoOrigen, archivoDestino, (err) => {
      if (err) {
        console.error('Error al mover el archivo:', err);
      } else {
        console.log('Archivo movido exitosamente');
      }
    });

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
    // const ftpClient = await conectarFTPLICITACIONES();
    // const remoteFilePath = `/var/www/vhosts/licitaciones.smt.gob.ar/PDF-Convocatorias/${nombre_anexo}`;
    // const localFilePath = path.join("./pdf", nombre_anexo);
    // Subir la imagen al servidor FTP
    // await ftpClient.uploadFrom(localFilePath, remoteFilePath);

    // Define las rutas de origen y destino
    const archivoOrigen = path.join(__dirname, '..', 'pdf', nombre_anexo);
    const archivoDestino = path.join(__dirname, '..', '..', 'httpdocs', 'PDF-Convocatorias', nombre_anexo);

    // Verifica si la carpeta destino existe, de lo contrario, créala
    const carpetaDestino = path.dirname(archivoDestino);
    if (!fs.existsSync(carpetaDestino)) {
      fs.mkdirSync(carpetaDestino, { recursive: true });
    }

    // Mueve el archivo
    fs.rename(archivoOrigen, archivoDestino, (err) => {
      if (err) {
        console.error('Error al mover el archivo:', err);
      } else {
        console.log('Archivo movido exitosamente');
      }
    });

    // Eliminar la imagen local después de subirla
    // fs.unlinkSync(localFilePath);
    // await ftpClient.close();
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

      // Define las rutas de origen y destino
      const archivoOrigen = path.join(__dirname, '..', 'pdf', nombre_anexo);
      const archivoDestino = path.join(__dirname, '..', '..', 'httpdocs', 'PDF-Convocatorias', nombreViejo);

      // Verifica si la carpeta destino existe, de lo contrario, créala
      const carpetaDestino = path.dirname(archivoDestino);
      if (!fs.existsSync(carpetaDestino)) {
        fs.mkdirSync(carpetaDestino, { recursive: true });
      }

      // Mueve el archivo
      fs.rename(archivoOrigen, archivoDestino, (err) => {
        if (err) {
          console.error('Error al mover el archivo:', err);
        } else {
          console.log('Archivo movido exitosamente');
        }
      });

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
    let nombreViejo = oldName.replace(/\//g, '-')
    let archivoViejo = nombre_archivo.replace(/\//g, '-')

    if (archivo) {
      // Define las rutas de origen y destino
      const archivoOrigen = path.join(__dirname, '..', 'pdf', archivoViejo);
      const archivoDestino = path.join(__dirname, '..', '..', 'httpdocs', 'PDF-Convocatorias', nombreViejo);

      // Verifica si la carpeta destino existe, de lo contrario, créala
      const carpetaDestino = path.dirname(archivoDestino);
      if (!fs.existsSync(carpetaDestino)) {
        fs.mkdirSync(carpetaDestino, { recursive: true });
      }

      // Mueve el archivo
      fs.rename(archivoOrigen, archivoDestino, (err) => {
        if (err) {
          console.error('Error al mover el archivo:', err);
        } else {
          console.log('Archivo movido exitosamente');
        }
      });
    } else {
      // Define las rutas de origen y destino
      const archivoOrigen = path.join(__dirname, '..', 'pdf', archivoViejo);
      const archivoDestino = path.join(__dirname, '..', '..', 'httpdocs', 'PDF-Convocatorias', nombreViejo);

      fs.rename(archivoOrigen, archivoDestino, (err) => {
        if (err) {
          console.error('Error al mover el archivo:', err);
        } else {
          console.log('Archivo movido exitosamente');
        }
      });
    }

    // Query para actualizar la contratacion
    const sql = "UPDATE contratacion SET nombre_contratacion = ?, id_tcontratacion = ?, fecha_presentacion = ?, hora_presentacion = ?, num_instrumento = ?, valor_pliego = ?, expte = ?, id_tinstrumento = ?, fecha_apertura = ?, hora_apertura = ?, habilita = ?, nombre_archivo = ?, detalle = ? WHERE id_contratacion = ?";
    const values = [nombre_contratacion, id_tcontratacion, fecha_presentacion, hora_presentacion, num_instrumento, valor_pliego, expte, id_tinstrumento, fecha_apertura, hora_apertura, habilita, archivoViejo, detalle, id];


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
    const sql = "INSERT INTO ubicacion (nombre_ubicacion, habilita) VALUES (?, ?)";
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

const agregarPatrimonio = async (req, res) => {
  try {
    const {
      nombre_patrimonio,
      anio_emplazamiento,
      descripcion,
      origen,
      id_categoria,
      id_tipologia,
      id_material,
      id_estado,
      id_autor,
      id_ubicacion,
      latylon,
      imagen_carrousel_1,
      imagen_carrousel_2,
      imagen_carrousel_3,
      habilita
    } = req.body;

    const archivo = req.file;

    if (!archivo) {
      return res.status(400).json({ message: "Por favor, adjunta un archivo" });
    }

    // Obtener el nombre del archivo cargado
    const nombre_archivo = archivo.filename;
    // Obtener el último id_patrimonio de la tabla
    const connection = await conectarSMTPatrimonio();
    const [lastIdResult] = await connection.query("SELECT MAX(id_patrimonio) AS max_id FROM patrimonio");
    let nextId = lastIdResult[0].max_id + 1; // Generar el próximo id_patrimonio
    // Query para insertar una nuevo patrimonio
    const sql =
      "INSERT INTO patrimonio (id_patrimonio, nombre_patrimonio, anio_emplazamiento, descripcion, origen, id_categoria, id_tipologia, id_material, id_estado, id_autor, id_ubicacion, latylon, imagen_carrousel_1, imagen_carrousel_2, imagen_carrousel_3, habilita, nombre_archivo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const values = [
      nextId,
      nombre_patrimonio,
      anio_emplazamiento,
      descripcion,
      origen,
      id_categoria,
      id_tipologia,
      id_material,
      id_estado,
      id_autor,
      id_ubicacion,
      latylon,
      imagen_carrousel_1,
      imagen_carrousel_2,
      imagen_carrousel_3,
      habilita,
      nombre_archivo,
    ];
    console.log(values)
    // Ejecutar la consulta SQL para insertar la nueva convocatoria
    await connection.execute(sql, values);
    const ftpClient = await conectarFTPCiudadano();
    const remoteFilePath = `/Fotos-Patrimonio/${nombre_archivo}`;
    const localFilePath = path.join("./pdf", nombre_archivo);
    // Subir la imagen al servidor FTP
    await ftpClient.uploadFrom(localFilePath, remoteFilePath);

    // Eliminar la imagen local después de subirla
    fs.unlinkSync(localFilePath);
    await ftpClient.close();
    res.status(201).json({ message: "Patrimonio creado con éxito", id: nextId, num_patrimonio: nextId });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const editarPatrimonio = async (req, res) => {
  try {
    const { nombre_patrimonio, anio_emplazamiento, descripcion, origen, id_categoria, id_tipologia, id_material, id_estado, id_autor, id_ubicacion, latylon, imagen_carrousel_1, imagen_carrousel_2, imagen_carrousel_3, habilita, id, oldName } = req.body;
    // Verificar si hay un archivo adjunto
    const archivo = req.file;
    let nombre_archivo = null;
    nombre_archivo = `${nombre_patrimonio.replace(/\s+/g, '').trim()}.jpg`;
    if (archivo) {
      let nombreViejo = `${oldName.replace(/\s+/g, '').trim()}.jpg`;
      let archivoViejo = nombre_archivo.replace(/\//g, '-');
      const ftpClient = await conectarFTPCiudadano();

      try {
        const localFilePath = path.join("./pdf", archivoViejo);
        const remoteFilePath = `/Fotos-Patrimonio/${archivoViejo}`;

        await ftpClient.remove(`/Fotos-Patrimonio/${nombreViejo}`);
        await ftpClient.uploadFrom(localFilePath, remoteFilePath);
        fs.unlinkSync(localFilePath);
      } finally {
        await ftpClient.close();
      }
    }
    // Query para actualizar la patrimonio
    const sql = "UPDATE patrimonio SET nombre_patrimonio = ?, anio_emplazamiento = ?, descripcion = ?, origen = ?, id_categoria = ?, id_tipologia = ?, id_material = ?, id_estado = ?, id_autor = ?, id_ubicacion = ?, latylon = ?, imagen_carrousel_1 = ?, imagen_carrousel_2 = ?, imagen_carrousel_3 = ?, habilita = ?, nombre_archivo = ? WHERE id_patrimonio = ?";
    const values = [nombre_patrimonio, anio_emplazamiento, descripcion, origen, id_categoria, id_tipologia, id_material, id_estado, id_autor, id_ubicacion, latylon, imagen_carrousel_1, imagen_carrousel_2, imagen_carrousel_3, habilita, nombre_archivo, id];
    // Verificar si la patrimonio ya existe con otra ID
    const connection = await conectarSMTPatrimonio();
    const [patrimonio] = await connection.execute(
      "SELECT * FROM patrimonio WHERE (nombre_patrimonio = ? AND descripcion = ? AND id_categoria = ? AND id_tipologia = ? AND latylon = ? AND habilita = ?) AND id_patrimonio != ?",
      [nombre_patrimonio, descripcion, id_categoria, id_tipologia, latylon, habilita, id ]
    );

    if (patrimonio.length === 0) {
      // No existe otra patrimonio con los mismos datos, se puede proceder con la actualización
      const [result] = await connection.execute(sql, values);
      console.log("Filas actualizadas:", result.affectedRows);
      res.status(200).json({ message: "Patrimonio modificado con éxito", result });
    } else {
      // Ya existe otra patrimonio con los mismos datos, devolver un error
      res.status(400).json({
        message: "Ya existe un Patrimonio con los mismos datos",
        patrimonio: patrimonio[0],
      });
    }
    connection.end();
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const listarPatrimonioBack = async (req, res) => {
  const connection = await conectarSMTPatrimonio();
  try {
    const [patrimonios] = await connection.execute(
      'SELECT patrimonio.*, ubicacion.nombre_ubicacion, tipologia.nombre_tipologia FROM patrimonio LEFT JOIN ubicacion ON patrimonio.id_ubicacion = ubicacion.id_ubicacion LEFT JOIN tipologia ON patrimonio.id_tipologia = tipologia.id_tipologia'
    );
    patrimonios.reverse();
    connection.end();
    res.status(200).json({ patrimonios })

  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const listarAutorPatrimonioBack = async (req, res) => {
  const connection = await conectarSMTPatrimonio();
  try {
    const [autores] = await connection.execute(
      'SELECT * FROM autor'
    );
    connection.end();
    res.status(200).json({ autores })

  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const listarUbicacionPatrimonioBack = async (req, res) => {
  const connection = await conectarSMTPatrimonio();
  try {
    const [ubicaciones] = await connection.execute(
      'SELECT * FROM ubicacion'
    );
    connection.end();
    res.status(200).json({ ubicaciones })

  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const listarEstadoPatrimonioBack = async (req, res) => {
  const connection = await conectarSMTPatrimonio();
  try {
    const [estados] = await connection.execute(
      'SELECT * FROM estado'
    );
    connection.end();
    res.status(200).json({ estados })

  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const listarMaterialPatrimonioBack = async (req, res) => {
  const connection = await conectarSMTPatrimonio();
  try {
    const [materiales] = await connection.execute(
      'SELECT * FROM material'
    );
    connection.end();
    res.status(200).json({ materiales })

  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const listarCategoriaPatrimonioBack = async (req, res) => {
  const connection = await conectarSMTPatrimonio();
  try {
    const [categorias] = await connection.execute(
      'SELECT * FROM categoria'
    );
    connection.end();
    res.status(200).json({ categorias })

  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const listarTipologiaPatrimonioBack = async (req, res) => {
  const connection = await conectarSMTPatrimonio();
  try {
    const [tipologias] = await connection.execute(
      'SELECT * FROM tipologia'
    );
    connection.end();
    res.status(200).json({ tipologias })

  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const deshabilitarPatrimonio = async (req, res) => {
  const { id } = req.body;
  console.log(req.body)
  const sql = "UPDATE patrimonio set habilita = 0 WHERE id_patrimonio = ?";
  const values = [id];

  try {
    const connection = await conectarSMTPatrimonio();
    const [result] = await connection.execute(sql, values); 
    await connection.end();
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "patrimonio deshabilitado con éxito" });
    } else {
      res.status(400).json({ message: "patrimonio no encontrada" });
    }
  } catch (error) {
    console.error("Error al eliminar el patrimonio:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};
//-----------PATRIMOINIO MUNICIPAL--------------



module.exports={ agregarOpcion, borrarOpcion, agregarProceso, listarTipoContratacion, listarTipoInstrumento, agregarContratacion, agregarAnexo, listarContratacionBack, borrarContratacion, editarContratacion, listarContratacion, editarAnexo, listarContratacionPorId, agregarPatrimonio, agregarCategoriaPatrimonio, agregarEstadoPatrimonio, agregarAutorPatrimonio, agregarMaterialPatrimonio, agregarUbicacionPatrimonio, agregarTipologiaPatrimonio, listarPatrimonioBack, listarAutorPatrimonioBack, listarTipologiaPatrimonioBack, listarCategoriaPatrimonioBack, listarMaterialPatrimonioBack, listarEstadoPatrimonioBack, listarUbicacionPatrimonioBack, deshabilitarPatrimonio, editarPatrimonio, listarGenero, editarGenero, agregarGenero, agregarTipoDeUsuario, listarTiposDeUsuario, editarTipoDeUsuario, agregarTipoDoc, editarTipoDoc, listarTipoDoc, agregarReparticion, editarReparticion, listarReparticion}