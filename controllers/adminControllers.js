const {
  conectarBDEstadisticasMySql,
  conectarSMTPatrimonio,
} = require("../config/dbEstadisticasMYSQL");
const { conectarSMTContratacion } = require("../config/dbEstadisticasMYSQL");
const { sequelize_ciu_digital_derivador } = require("../config/sequelize");
const Proceso = require("../models/Derivador/Proceso");
const PermisoTUsuario = require("../models/Derivador/PermisoTUsuario");
const fs = require("fs");
const path = require("path");
const { conectarFTPCiudadano } = require("../config/winscpCiudadano");
const { conectarSFTPCondor } = require("../config/winscpCondor");

const agregarOpcion = async (req, res) => {
  let connection;
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
    connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values);
    const nuevoId = result.insertId; // Obtener el id generado por la base de datos

    res.status(201).json({ id: nuevoId, message: "Opción creada con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};
const agregarProceso = async (req, res) => {
  let transaction;
  let connection;
  try {
    const { nombre_proceso, habilita, descripcion, id_opcion } = req.body;
    // Verificar que los valores requeridos estén definidos
    if (
      nombre_proceso === undefined ||
      habilita === undefined ||
      descripcion === undefined ||
      id_opcion === undefined
    ) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }
    // Iniciar una transacción
    transaction = await sequelize_ciu_digital_derivador.transaction();
    connection = await conectarBDEstadisticasMySql();

    // Obtener la lista de tipos de usuario
    const [tiposUsuario, fieldsTiposUsuario] = await connection.execute(
      "SELECT id_tusuario FROM tipo_usuario"
    );
    // Crear el nuevo proceso en la base de datos dentro de la transacción
    const nuevoProceso = await Proceso.create(
      {
        nombre_proceso,
        descripcion,
        id_opcion,
        habilita,
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

    // Commit de la transacción si todas las operaciones fueron exitosas
    await transaction.commit();

    // Responder con el ID del nuevo proceso creado
    res
      .status(201)
      .json({ id: nuevoProceso.id, message: "Proceso creado con éxito" });
  } catch (error) {
    // Rollback de la transacción en caso de error
    if (transaction) await transaction.rollback();

    // Responder con un mensaje de error
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const borrarOpcion = async (req, res) => {
  const { id } = req.body;
  const sql = "UPDATE opcion set habilita = 0 WHERE id_opcion = ?";
  const values = [id];
  let connection;

  try {
    connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values);
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "opción deshabilitada con éxito" });
    } else {
      res.status(400).json({ message: "opción no encontrada" });
    }
  } catch (error) {
    console.error("Error al eliminar la opción:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const listarPermisosPorTUsuarios = async (req, res) => {
  const { id } = req.body;
  if (id == undefined) {
    res.status(500).json("algo salio mal");
    return;
  }
  const sql =
    "SELECT pt.id_permiso_tusuario, pt.id_proceso, pt.ver, p.nombre_proceso, tu.nombre_tusuario FROM permiso_tusuario pt LEFT JOIN proceso p  on pt.id_proceso = p.id_proceso  LEFT JOIN tipo_usuario tu ON pt.id_tusuario = tu.id_tusuario  WHERE pt.id_proceso = ? ORDER BY tu.nombre_tusuario ASC ";
  const values = [id];
  let connection;
  try {
    connection = await conectarBDEstadisticasMySql();
    const [permisos] = await connection.execute(sql, values);
    res.status(200).json({ permisos });
  } catch (error) {
    console.error("Error al traer los permisos:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const actualizarPermisosPorTUsuario = async (req, res) => {
  let connection;
  try {
    const { id, permisos } = req.body;
    if (!permisos || !Array.isArray(permisos)) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }
    console.log("Permisos a actualizar:", permisos);
    connection = await conectarBDEstadisticasMySql();
    for (const permiso of permisos) {
      const { id: procesoId, ver } = permiso;
      console.log(`Actualizando permiso con id ${procesoId} a ver=${ver}`);
      const updateSql =
        "UPDATE permiso_tusuario SET ver = ? WHERE  id_permiso_tusuario = ?;";
      const updateValues = [ver, procesoId];
      const [result] = await connection.execute(updateSql, updateValues);
      if (result.affectedRows !== 1) {
        throw new Error(`No se pudo actualizar el permiso con id ${procesoId}`);
      }
    }
    res.status(200).json({ message: "Permisos actualizados correctamente" });
  } catch (error) {
    console.error("Error al actualizar permisos:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    if (connection) {
      connection.end();
    }
  }
};

// --------------------PANEL PARA USUARIOS ----------------------

const listarEmpleados = async (req, res) => {
  const connection = await conectarBDEstadisticasMySql();
  try {
    const [empleados] = await connection.execute(
      "SELECT e.id_persona, p.id_tusuario, tp.nombre_tusuario, e.afiliado, p.documento_persona, p.nombre_persona, p.apellido_persona, p.email_persona, r.nombre_reparticion FROM empleado e LEFT JOIN persona p ON e.id_persona = p.id_persona LEFT JOIN tipo_usuario tp ON p.id_tusuario = tp.id_tusuario LEFT JOIN reparticion r ON e.id_reparticion = r.id_reparticion"
    );
    res.status(200).json({ empleados });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};
const listarProcesosSinId = async (req, res) => {
  const connection = await conectarBDEstadisticasMySql();
  try {
    const [procesos] = await connection.execute(
      "SELECT * FROM proceso ORDER BY proceso.descripcion ASC"
    );
    res.status(200).json({ procesos });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};
const cambiarTipoDeUsuario = async (req, res) => {
  let connection;
  try {
    const { id, id_persona } = req.body;

    // Verificar que los valores requeridos estén definidos
    if (id === undefined || id_persona === undefined) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }

    const sql = "UPDATE persona SET id_tusuario = ? WHERE id_persona = ?";
    const values = [id, id_persona];

    // Ejecutar la consulta SQL para insertar la nueva opción
    connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values);
    const nuevoId = result.insertId; // Obtener el id generado por la base de datos

    res
      .status(201)
      .json({ id: nuevoId, message: "Tipo de Usuario modificado." });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};
const actualizarPermisosEspecificos = async (req, res) => {
  let connection;
  try {
    const { id_persona, permisos } = req.body;
    if (!id_persona) {
      throw new Error("El parámetro 'id_persona' es requerido");
    }
    if (!permisos || !Array.isArray(permisos)) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }

    connection = await conectarBDEstadisticasMySql();

    // Verificar si el id_persona existe en la tabla permiso_persona
    const selectSql =
      "SELECT COUNT(*) as count FROM permiso_persona WHERE id_persona = ?";
    const [selectResult] = await connection.execute(selectSql, [id_persona]);
    const personaExiste = selectResult[0].count > 0;

    if (personaExiste) {
      // Si existe, actualizar los permisos
      for (const permiso of permisos) {
        const { id: procesoId, ver } = permiso;

        if (procesoId === undefined || ver === undefined) {
          throw new Error("Los parámetros del permiso son inválidos");
        }
        const updateSql =
          "UPDATE permiso_persona SET ver = ? WHERE id_proceso = ? AND id_persona = ?";
        const updateValues = [ver, procesoId, id_persona];
        const [result] = await connection.execute(updateSql, updateValues);
        if (result.affectedRows !== 1) {
          throw new Error(
            `No se pudo actualizar el permiso con id ${procesoId}`
          );
        }
      }
    } else {
      // Si no existe, insertar nuevos registros
      for (const permiso of permisos) {
        const { id: procesoId, ver } = permiso;

        if (procesoId === undefined || ver === undefined) {
          throw new Error("Los parámetros del permiso son inválidos");
        }
        const insertSql =
          "INSERT INTO permiso_persona (id_persona, id_proceso, ver) VALUES (?, ?, ?)";
        const insertValues = [id_persona, procesoId, ver];
        const [result] = await connection.execute(insertSql, insertValues);
        if (result.affectedRows !== 1) {
          throw new Error(`No se pudo insertar el permiso con id ${procesoId}`);
        }
      }
    }

    res.status(200).json({ message: "Permisos actualizados correctamente" });
  } catch (error) {
    console.error("Error al actualizar permisos:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    if (connection) {
      connection.end();
    }
  }
};
const existeEnPermisosPersona = async (req, res) => {
  const { id } = req.body;
  const sql = "SELECT * FROM permiso_persona WHERE id_persona = ?";
  const values = [id];
  let connection;
  if (id == undefined) {
    res.status(500).json("No llego el id");
    return;
  }
  try {
    connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values);
    if (result.length > 0) {
      res.status(200).json({ message: "Existe", data: result });
    } else {
      res.status(404).json({ message: "Persona no encontrada" });
    }
  } catch (error) {
    console.error("Error al verificar los permisos de la persona:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    if (connection) {
      connection.end();
    }
  }
};

// --------------------PANEL PARA USUARIOS ----------------------

// --------------------PANEL PARA GENERO DERIVADOR----------------------

const agregarGenero = async (req, res) => {
  let connection;
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
    connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values);
    const nuevoId = result.insertId; // Obtener el id generado por la base de datos

    res
      .status(201)
      .json({ id: nuevoId, message: "Tipología creada con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const editarGenero = async (req, res) => {
  const { id, nombre_genero, habilita } = req.body;
  const sql =
    "UPDATE genero set habilita = ?, nombre_genero = ? WHERE id_genero = ?";
  const values = [habilita, nombre_genero, id];
  let connection;

  try {
    connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values);
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Genero editado con éxito" });
    } else {
      res.status(400).json({ message: "Genero no encontrado" });
    }
  } catch (error) {
    logger.error("Error en editarGenero: " + error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const listarGenero = async (req, res) => {
  const connection = await conectarBDEstadisticasMySql();
  try {
    const [generos] = await connection.execute("SELECT * FROM genero");
    res.status(200).json({ generos });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

// --------------------PANEL PARA GENERO DERIVADOR----------------------

// --------------------PANEL PARA TIPO DOCUMENTO DERIVADOR----------------------

const agregarTipoDoc = async (req, res) => {
  let connection;
  try {
    const { nombre_tdocumento, habilita } = req.body;

    // Verificar que los valores requeridos estén definidos
    if (nombre_tdocumento === undefined || habilita === undefined) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }

    // Query para insertar una nuevo genero
    const sql =
      "INSERT INTO tipo_documento (nombre_tdocumento, habilita) VALUES (?, ?)";
    const values = [nombre_tdocumento, habilita];

    // Ejecutar la consulta SQL para insertar la nueva opción
    connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values);
    const nuevoId = result.insertId; // Obtener el id generado por la base de datos

    res
      .status(201)
      .json({ id: nuevoId, message: "Tipo Documento creado con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};
const editarTipoDoc = async (req, res) => {
  const { id, nombre_tdocumento, habilita } = req.body;
  const sql =
    "UPDATE genero set habilita = ?, nombre_tdocumento = ? WHERE id_tdocumento = ?";
  const values = [habilita, nombre_tdocumento, id];
  let connection;

  try {
    connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values);
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Tipo documento editado con éxito" });
    } else {
      res.status(400).json({ message: "Tipo documento no encontrado" });
    }
  } catch (error) {
    console.error("Error al editar el Tipo documento:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};
const listarTipoDoc = async (req, res) => {
  const connection = await conectarBDEstadisticasMySql();
  try {
    const [tdocumentos] = await connection.execute(
      "SELECT * FROM tipo_documento"
    );
    res.status(200).json({ tdocumentos });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

// --------------------PANEL PARA TIPO DOCUMENTO DERIVADOR----------------------

// --------------------PANEL PARA REPARTICIONES ----------------------

const agregarReparticion = async (req, res) => {
  let connection;
  try {
    const {
      item,
      nombre_reparticion,
      depende,
      secretaria,
      vigente_desde,
      vigente_hasta,
      habilita,
    } = req.body;

    // Verificar que los valores requeridos estén definidos
    if (
      item === undefined ||
      nombre_reparticion === undefined ||
      depende === undefined ||
      secretaria === undefined ||
      vigente_desde === undefined ||
      vigente_hasta === undefined ||
      habilita === undefined
    ) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }

    // Query para insertar una nuevo genero
    const sql =
      "INSERT INTO reparticion (item, nombre_reparticion, depende, secretaria, vigente_desde, vigente_hasta, habilita) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const values = [
      item,
      nombre_reparticion,
      depende,
      secretaria,
      vigente_desde,
      vigente_hasta,
      habilita,
    ];

    // Ejecutar la consulta SQL para insertar la nueva opción
    connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values);
    const nuevoId = result.insertId; // Obtener el id generado por la base de datos

    res
      .status(201)
      .json({ id: nuevoId, message: "Repartición creada con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};
const editarReparticion = async (req, res) => {
  const {
    id,
    item,
    nombre_reparticion,
    depende,
    secretaria,
    vigente_desde,
    vigente_hasta,
    habilita,
  } = req.body;
  const sql =
    "UPDATE reparticion set item = ?, nombre_reparticion = ?, depende = ?, secretaria = ?, vigente_desde = ?, vigente_hasta = ?, habilita = ? WHERE id_reparticion = ?";
  const values = [
    item,
    nombre_reparticion,
    depende,
    secretaria,
    vigente_desde,
    vigente_hasta,
    habilita,
    id,
  ];
  let connection;

  try {
    connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values);
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Repartición editada con éxito" });
    } else {
      res.status(400).json({ message: "Repartición no encontrada" });
    }
  } catch (error) {
    console.error("Error al editar la Repartición:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};
const listarReparticion = async (req, res) => {
  const connection = await conectarBDEstadisticasMySql();
  try {
    const [reparticiones] = await connection.execute(
      "SELECT * FROM reparticion"
    );
    res.status(200).json({ reparticiones });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

// --------------------PANEL PARA REPARTICIONES ----------------------

// --------------------PANEL PARA TIPO DE USUARIO DERIVADOR----------------------

const agregarTipoDeUsuario = async (req, res) => {
  let connection;
  try {
    const { nombre_tusuario, observacion, habilita } = req.body;

    // Verificar que los valores requeridos estén definidos
    if (
      nombre_tusuario === undefined ||
      observacion === undefined ||
      habilita === undefined
    ) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }

    // Query para insertar una nuevo tipo de usuario
    const sql =
      "INSERT INTO tipo_usuario (nombre_tusuario, observacion, habilita) VALUES (?, ?, ?)";
    const values = [nombre_tusuario, observacion, habilita];

    // Ejecutar la consulta SQL para insertar la nueva opción
    connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values);
    const nuevoId = result.insertId; // Obtener el id generado por la base de datos

    res
      .status(201)
      .json({ id: nuevoId, message: "Tipo de usuario creado con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const listarTiposDeUsuario = async (req, res) => {
  const connection = await conectarBDEstadisticasMySql();
  try {
    const [tusuarios] = await connection.execute("SELECT * FROM tipo_usuario");
    res.status(200).json({ tusuarios });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const editarTipoDeUsuario = async (req, res) => {
  const { id, nombre_tusuario, observacion, habilita } = req.body;
  const sql =
    "UPDATE tipo_usuario set habilita = ?, nombre_tusuario = ? , observacion = ? WHERE id_tusuario = ?";
  const values = [habilita, nombre_tusuario, observacion, id];
  let connection;

  try {
    connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values);
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Tipo de usuario editado con éxito" });
    } else {
      res.status(400).json({ message: "Tipo de usuario no encontrado" });
    }
  } catch (error) {
    console.error("Error al editar el Tipo de usuario:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const listarProcesos = async (req, res) => {
  let connection;
  try {
    const { id } = req.body;

    // Verificar que los valores requeridos estén definidos
    if (id === undefined) {
      return res
        .status(500)
        .json({ message: "No llego el id para listarProcesos" });
    }

    const sql =
      "SELECT pt.*, p.nombre_proceso, p.descripcion FROM permiso_tusuario pt LEFT JOIN proceso p ON pt.id_proceso = p.id_proceso WHERE id_tusuario = ? ORDER BY p.descripcion ASC";
    const values = [id];

    // Ejecutar la consulta SQL para obtener los procesos
    connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values);

    // Devolver los procesos obtenidos
    res.status(200).json({ procesos: result });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

const actualizarPermisosTUsuario = async (req, res) => {
  let connection;
  try {
    const { id, permisos } = req.body;
    if (!id || !permisos || !Array.isArray(permisos)) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }
    console.log("ID de usuario:", id);
    console.log("Permisos a actualizar:", permisos);
    connection = await conectarBDEstadisticasMySql();
    for (const permiso of permisos) {
      const { id: procesoId, ver } = permiso;
      console.log(`Actualizando permiso con id ${procesoId} a ver=${ver}`);
      const updateSql =
        "UPDATE permiso_tusuario SET ver = ? WHERE id_permiso_tusuario = ?";
      const updateValues = [ver, procesoId];
      const [result] = await connection.execute(updateSql, updateValues);
      if (result.affectedRows !== 1) {
        throw new Error(`No se pudo actualizar el permiso con id ${procesoId}`);
      }
    }
    res.status(200).json({ message: "Permisos actualizados correctamente" });
  } catch (error) {
    console.error("Error al actualizar permisos:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    if (connection) {
      connection.end();
    }
  }
};

// --------------------PANEL PARA TIPO DE USUARIO DERIVADOR----------------------

//-----------CONTRATACIONES--------------
const listarTipoContratacion = async (req, res) => {
  const connection = await conectarSMTContratacion();
  try {
    const [contrataciones] = await connection.execute(
      "SELECT * FROM tipo_contratacion WHERE habilita = 1"
    );
    res.status(200).json({ contrataciones });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};
const listarContratacionPorId = async (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM contratacion WHERE id_contratacion = ?";
  const values = [id];
  let connection;
  try {
    connection = await conectarSMTContratacion();
    const [contratacion] = await connection.execute(sql, values);
    if (contratacion.length > 0) {
      res.status(200).json({ contratacion });
    } else {
      res.status(400).json({ message: "No se encontró la contratación" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};
const listarTipoInstrumento = async (req, res) => {
  const connection = await conectarSMTContratacion();
  try {
    const [instrumentos] = await connection.execute(
      "SELECT * FROM tipo_instrumento WHERE habilita = 1"
    );
    res.status(200).json({ instrumentos });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const listarContratacionBack = async (req, res) => {
  const connection = await conectarSMTContratacion();
  try {
    const [contrataciones] = await connection.execute(
      "SELECT * FROM contratacion"
    );

    contrataciones.reverse();
    res.status(200).json({ contrataciones });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const listarContratacion = async (req, res) => {
  const connection = await conectarSMTContratacion();
  try {
    const [contrataciones] = await connection.execute(
      "SELECT * FROM contratacion WHERE habilita = 1"
    );

    contrataciones.reverse();
    res.status(200).json({ contrataciones });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const agregarContratacion = async (req, res) => {
  let connection;
  connection = await conectarSMTContratacion();
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
      habilita,
    } = req.body;

    const archivo = req.file;

    if (archivo == undefined) {
      logger.error("Error por falta de archivo");
      return res.status(500).json({ message: "Por favor, adjunta un archivo" });
    }

    // Obtener el nombre del archivo cargado
    const nombre_archivo = archivo.filename;
    const detalleValorPorDefecto = "";
    const detalleFinal = detalle ?? detalleValorPorDefecto;
    // Obtener el último id_contratacion de la tabla
    const [lastIdResult] = await connection.query(
      "SELECT MAX(id_contratacion) AS max_id FROM contratacion"
    );
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
      detalleFinal,
    ];

    // Ejecutar la consulta SQL para insertar la nueva convocatoria
    await connection.execute(sql, values);

    // Define las rutas de origen y destino
    const archivoOrigen = path.join(__dirname, "..", "pdf", nombre_archivo);
    const archivoDestino = path.join(
      __dirname,
      "..",
      "..",
      "httpdocs",
      "PDF-Convocatorias",
      nombre_archivo
    );

    // Verifica si la carpeta destino existe, de lo contrario, créala
    const carpetaDestino = path.dirname(archivoDestino);
    if (!fs.existsSync(carpetaDestino)) {
      fs.mkdirSync(carpetaDestino, { recursive: true });
    }

    // Mueve el archivo
    fs.rename(archivoOrigen, archivoDestino, (err) => {
      if (err) {
        console.log("Error al mover el archivo:", err);
      } else {
        console.log("Archivo movido exitosamente");
      }
    });

    res.status(201).json({
      message: "Convocatoria creada con éxito",
      id: nextId,
      num_contratacion: nextId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection?.end();
  }
};

const agregarAnexo = async (req, res) => {
  let connection;
  connection = await conectarSMTContratacion();
  try {
    const archivo = req.file;
    if (!archivo) {
      return res.status(400).json({ message: "Por favor, adjunta un archivo" });
    }

    // Obtener el nombre del archivo cargado
    const nombre_anexo = archivo.filename;

    // Obtener el último id_contratacion de la tabla
    const [lastIdResult] = await connection.query(
      "SELECT MAX(id_contratacion) AS max_id FROM contratacion"
    );
    let maxId = lastIdResult[0].max_id;
    // Query para insertar una nueva convocatoria
    const sql =
      "UPDATE contratacion SET `nombre_anexo`= ? WHERE `id_contratacion`= ?";
    const values = [nombre_anexo, maxId];
    console.log(values);
    // Ejecutar la consulta SQL para insertar la nueva convocatoria
    await connection.execute(sql, values);

    // Define las rutas de origen y destino
    const archivoOrigen = path.join(__dirname, "..", "pdf", nombre_anexo);
    const archivoDestino = path.join(
      __dirname,
      "..",
      "..",
      "httpdocs",
      "PDF-Convocatorias",
      nombre_anexo
    );

    // Verifica si la carpeta destino existe, de lo contrario, créala
    const carpetaDestino = path.dirname(archivoDestino);
    if (!fs.existsSync(carpetaDestino)) {
      fs.mkdirSync(carpetaDestino, { recursive: true });
    }

    // Mueve el archivo
    fs.rename(archivoOrigen, archivoDestino, (err) => {
      if (err) {
        console.error("Error al mover el archivo:", err);
      } else {
        console.log("Archivo movido exitosamente");
      }
    });
    res.status(201).json({ message: "Anexo agregado con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection?.end();
  }
};

const editarAnexo = async (req, res) => {
  let connection;
  connection = await conectarSMTContratacion();
  try {
    const { id, oldName, num_instrumento, expte } = req.query;
    const archivo = req.file;
    let nombre_anexo = null;
    if (archivo) {
      const instrumento = num_instrumento.replace(/\//g, "-");
      const expediente = expte.replace(/\//g, "-");
      let nombreViejo = oldName.replace(/\//g, "-");
      nombre_anexo = `CONTRATACION_${instrumento}_EXPTE_${expediente}_ANEXO.pdf`;

      // Define las rutas de origen y destino
      const archivoOrigen = path.join(__dirname, "..", "pdf", nombre_anexo);
      const archivoDestino = path.join(
        __dirname,
        "..",
        "..",
        "httpdocs",
        "PDF-Convocatorias",
        nombreViejo
      );

      // Verifica si la carpeta destino existe, de lo contrario, créala
      const carpetaDestino = path.dirname(archivoDestino);
      if (!fs.existsSync(carpetaDestino)) {
        fs.mkdirSync(carpetaDestino, { recursive: true });
      }

      // Mueve el archivo
      fs.rename(archivoOrigen, archivoDestino, (err) => {
        if (err) {
          console.error("Error al mover el archivo:", err);
        } else {
          console.log("Archivo movido exitosamente");
        }
      });
    }
    // Query para actualizar la contratacion
    const sql =
      "UPDATE contratacion SET `nombre_anexo`= ? WHERE `id_contratacion`= ?";
    const values = [nombre_anexo, id];
    // Verificar si la contratacion ya existe con otra ID

    await connection.execute(sql, values);

    res.status(201).json({ message: "Anexo editado con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const borrarContratacion = async (req, res) => {
  const { id } = req.body;
  const sql = "UPDATE contratacion set habilita = 0 WHERE id_contratacion = ?";
  const values = [id];
  let connection;

  try {
    connection = await conectarSMTContratacion();
    const [result] = await connection.execute(sql, values);
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Contratación deshabilitada con éxito" });
    } else {
      res.status(400).json({ message: "Contratación no encontrada" });
    }
  } catch (error) {
    console.error("Error al eliminar la contratación:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const editarContratacion = async (req, res) => {
  let connection;
  connection = await conectarSMTContratacion();
  try {
    const {
      id,
      nombre_contratacion,
      id_tcontratacion,
      fecha_presentacion,
      hora_presentacion,
      num_instrumento,
      valor_pliego,
      expte,
      id_tinstrumento,
      fecha_apertura,
      hora_apertura,
      habilita,
      oldName,
      detalle,
    } = req.body;
    // Verificar si hay un archivo adjunto
    console.log(req.body);
    const archivo = req.file;
    let nombre_archivo = null;
    nombre_archivo = `CONTRATACION_${num_instrumento}_EXPTE_${expte}.pdf`;
    let nombreViejo = oldName.replace(/\//g, "-");
    let archivoViejo = nombre_archivo.replace(/\//g, "-");

    if (archivo) {
      // Define las rutas de origen y destino
      const archivoOrigen = path.join(__dirname, "..", "pdf", archivoViejo);
      const archivoDestino = path.join(
        __dirname,
        "..",
        "..",
        "httpdocs",
        "PDF-Convocatorias",
        nombreViejo
      );

      // Verifica si la carpeta destino existe, de lo contrario, créala
      const carpetaDestino = path.dirname(archivoDestino);
      if (!fs.existsSync(carpetaDestino)) {
        fs.mkdirSync(carpetaDestino, { recursive: true });
      }

      // Mueve el archivo
      fs.rename(archivoOrigen, archivoDestino, (err) => {
        if (err) {
          console.error("Error al mover el archivo:", err);
        } else {
          console.log("Archivo movido exitosamente");
        }
      });
    } else {
      // Define las rutas de origen y destino
      const archivoOrigen = path.join(__dirname, "..", "pdf", archivoViejo);
      const archivoDestino = path.join(
        __dirname,
        "..",
        "..",
        "httpdocs",
        "PDF-Convocatorias",
        nombreViejo
      );

      fs.rename(archivoOrigen, archivoDestino, (err) => {
        if (err) {
          console.error("Error al mover el archivo:", err);
        } else {
          console.log("Archivo movido exitosamente");
        }
      });
    }

    // Query para actualizar la contratacion
    const sql =
      "UPDATE contratacion SET nombre_contratacion = ?, id_tcontratacion = ?, fecha_presentacion = ?, hora_presentacion = ?, num_instrumento = ?, valor_pliego = ?, expte = ?, id_tinstrumento = ?, fecha_apertura = ?, hora_apertura = ?, habilita = ?, nombre_archivo = ?, detalle = ? WHERE id_contratacion = ?";
    const values = [
      nombre_contratacion,
      id_tcontratacion,
      fecha_presentacion,
      hora_presentacion,
      num_instrumento,
      valor_pliego,
      expte,
      id_tinstrumento,
      fecha_apertura,
      hora_apertura,
      habilita,
      archivoViejo,
      detalle,
      id,
    ];

    // Verificar si la contratacion ya existe con otra ID
    const [contratacion] = await connection.execute(
      "SELECT * FROM contratacion WHERE (nombre_contratacion = ? AND id_tcontratacion = ? AND num_instrumento = ? AND valor_pliego = ? AND expte = ? AND habilita = ?) AND id_contratacion != ?",
      [
        nombre_contratacion,
        id_tcontratacion,
        num_instrumento,
        valor_pliego,
        expte,
        habilita,
        id,
      ]
    );

    if (contratacion.length === 0) {
      // No existe otra contratacion con los mismos datos, se puede proceder con la actualización
      const [result] = await connection.execute(sql, values);
      console.log("Filas actualizadas:", result.affectedRows);
      res
        .status(200)
        .json({ message: "Contratacion modificada con éxito", result });
    } else {
      // Ya existe otra contratacion con los mismos datos, devolver un error
      res.status(400).json({
        message: "Ya existe una contratacion con los mismos datos",
        contratacion: contratacion[0],
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection?.end();
  }
};
//-----------CONTRATACIONES--------------

//-----------PATRIMOINIO MUNICIPAL--------------

const agregarCategoriaPatrimonio = async (req, res) => {
  let connection;
  try {
    const { nombre_categoria, habilita } = req.body;

    // Verificar que los valores requeridos estén definidos
    if (nombre_categoria === undefined || habilita === undefined) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }

    // Query para insertar una nueva categoria
    const sql =
      "INSERT INTO categoria (nombre_categoria, habilita) VALUES (?, ?)";
    const values = [nombre_categoria, habilita];

    // Ejecutar la consulta SQL para insertar la nueva opción
    connection = await conectarSMTPatrimonio();
    const [result] = await connection.execute(sql, values);
    const nuevoId = result.insertId; // Obtener el id generado por la base de datos

    res
      .status(201)
      .json({ id: nuevoId, message: "Categoria creada con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const agregarTipologiaPatrimonio = async (req, res) => {
  let connection;
  try {
    const { nombre_tipologia, habilita } = req.body;

    // Verificar que los valores requeridos estén definidos
    if (nombre_tipologia === undefined || habilita === undefined) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }

    // Query para insertar una nueva tipologia
    const sql =
      "INSERT INTO tipologia (nombre_tipologia, habilita) VALUES (?, ?)";
    const values = [nombre_tipologia, habilita];

    // Ejecutar la consulta SQL para insertar la nueva opción
    connection = await conectarSMTPatrimonio();
    const [result] = await connection.execute(sql, values);
    const nuevoId = result.insertId; // Obtener el id generado por la base de datos

    res
      .status(201)
      .json({ id: nuevoId, message: "Tipología creada con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const agregarMaterialPatrimonio = async (req, res) => {
  let connection;
  try {
    const { nombre_material, habilita } = req.body;

    // Verificar que los valores requeridos estén definidos
    if (nombre_material === undefined || habilita === undefined) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }

    // Query para insertar una nueva tipologia
    const sql =
      "INSERT INTO material (nombre_material, habilita) VALUES (?, ?)";
    const values = [nombre_material, habilita];

    // Ejecutar la consulta SQL para insertar la nueva opción
    connection = await conectarSMTPatrimonio();
    const [result] = await connection.execute(sql, values);
    const nuevoId = result.insertId; // Obtener el id generado por la base de datos

    res.status(201).json({ id: nuevoId, message: "Material creado con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const agregarEstadoPatrimonio = async (req, res) => {
  let connection;
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
    connection = await conectarSMTPatrimonio();
    const [result] = await connection.execute(sql, values);
    const nuevoId = result.insertId; // Obtener el id generado por la base de datos

    res.status(201).json({ id: nuevoId, message: "Estado creado con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const agregarAutorPatrimonio = async (req, res) => {
  let connection;
  try {
    const { nombre_autor, descripcion_autor, habilita } = req.body;

    // Verificar que los valores requeridos estén definidos
    if (nombre_autor === undefined || habilita === undefined) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }

    // Query para insertar una nuevo estado
    const sql =
      "INSERT INTO autor (nombre_autor, descripcion_autor, habilita) VALUES (?, ?, ?)";
    const values = [nombre_autor, descripcion_autor, habilita];

    // Ejecutar la consulta SQL para insertar el nuevo autor
    connection = await conectarSMTPatrimonio();
    const [result] = await connection.execute(sql, values);
    const nuevoId = result.insertId; // Obtener el id generado por la base de datos

    res.status(201).json({ id: nuevoId, message: "Autor creado con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const agregarUbicacionPatrimonio = async (req, res) => {
  let connection;
  try {
    const { nombre_ubicacion, habilita } = req.body;

    // Verificar que los valores requeridos estén definidos
    if (nombre_ubicacion === undefined || habilita === undefined) {
      throw new Error("Los parámetros de la solicitud son inválidos");
    }

    // Query para insertar una nuevo estado
    const sql =
      "INSERT INTO ubicacion (nombre_ubicacion, habilita) VALUES (?, ?)";
    const values = [nombre_ubicacion, habilita];

    // Ejecutar la consulta SQL para insertar el nuevo autor
    connection = await conectarSMTPatrimonio();
    const [result] = await connection.execute(sql, values);
    const nuevoId = result.insertId; // Obtener el id generado por la base de datos

    res.status(201).json({ id: nuevoId, message: "Autor creado con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const agregarPatrimonio = async (req, res) => {
  let connection;
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
      habilita,
    } = req.body;

    const archivo = req.file;
    console.log("Archivo:", archivo);

    if (!archivo) {
      return res.status(400).json({ message: "Por favor, adjunta un archivo" });
    }

    // Obtener el nombre del archivo cargado
    const nombre_archivo = archivo.filename;
    console.log("Nombre archivo:", nombre_archivo);
    // Obtener el último id_patrimonio de la tabla
    connection = await conectarSMTPatrimonio();
    const [lastIdResult] = await connection.query(
      "SELECT MAX(id_patrimonio) AS max_id FROM patrimonio"
    );
    console.log("Last ID result:", lastIdResult);
    let nextId = lastIdResult[0].max_id + 1; // Generar el próximo id_patrimonio
    console.log("Next ID:", nextId);
    // Query para insertar una nuevo patrimonio
    const sql =
      "INSERT INTO patrimonio (id_patrimonio, nombre_patrimonio, anio_emplazamiento, descripcion, origen, id_categoria, id_tipologia, id_material, id_estado, id_autor, id_ubicacion, latylon, nombre_archivo, habilita, imagen_carrousel_1, imagen_carrousel_2, imagen_carrousel_3 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
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
      nombre_archivo,
      habilita,
      imagen_carrousel_1,
      imagen_carrousel_2,
      imagen_carrousel_3,
    ];
    console.log(values);
    // Ejecutar la consulta SQL para insertar la nueva convocatoria
    await connection.execute(sql, values);
    // const ftpClient = await conectarFTPCiudadano();
    const sftpClient = await conectarSFTPCondor();
    // const remoteFilePath = `/Fotos-Patrimonio/${nombre_archivo}`;
    const remoteFilePath = `/var/www/vhosts/cidituc.smt.gob.ar/Fotos-Patrimonio/${nombre_archivo}`;
    const localFilePath = path.join("./pdf", nombre_archivo);
    console.log("Remote file path:", remoteFilePath);
    console.log("Local file path:", localFilePath);
    // Subir la imagen al servidor FTP
    // await ftpClient.uploadFrom(localFilePath, remoteFilePath);
    await sftpClient.put(localFilePath, remoteFilePath);

    // Eliminar la imagen local después de subirla
    fs.unlinkSync(localFilePath);
    // await ftpClient.close();
    await sftpClient.end();
    res.status(201).json({
      message: "Patrimonio creado con éxito",
      id: nextId,
      num_patrimonio: nextId,
    });
  } catch (error) {
    console.error("Error:", error);
    // res.status(500).json({ message: error.message || "Algo salió mal :(" });
    res.status(500).json(error);
  } finally {
    connection.end();
  }
};

const obtenerImagenes = (req, res) => {
  const imageDirectory = path.join(
    __dirname,
    // "/var/www/vhosts/cidituc.smt.gob.ar/Fotos-Patrimonio"
    "../pdf"
  );
  const { image } = req.query;

  if (!image) {
    return res.status(400).send("No image specified");
  }

  const imagePath = path.join(imageDirectory, image);
  console.log(`Requested image path: ${imagePath}`);

  // Verifica si la imagen existe y envíala como respuesta
  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error("Image not found:", imagePath);
      return res.status(404).send("Image not found");
    }

    res.sendFile(imagePath);
  });
};

const editarPatrimonio = async (req, res) => {
  let connection;
  try { 
    console.log("req.body",req.body)
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
      habilita,
      id,
      oldName,
    } = req.body;

    const archivo = req.file;
    console.log(nombre_patrimonio)
    const nombre_archivo = `${nombre_patrimonio.replace(/\s+/g, "").trim()}.jpg`;

    if (archivo) {
      const nombreViejo = `${oldName.replace(/\s+/g, "").trim()}.jpg`;
      const archivoViejo = nombre_archivo.replace(/\//g, "-");
      const sftpClient = await conectarSFTPCondor();
      const localFilePath = path.join("./pdf", archivoViejo);
      const remoteFilePath = `/var/www/vhosts/cidituc.smt.gob.ar/Fotos-Patrimonio/${archivoViejo}`;

      try {
        // Verificar si el archivo local existe
        if (!fs.existsSync(localFilePath)) {
          throw new Error(`El archivo local no existe: ${localFilePath}`);
        }

        // Intentar eliminar el archivo remoto si existe
        try {
          await sftpClient.delete(remoteFilePath);
          console.log(`Archivo remoto ${remoteFilePath} eliminado exitosamente`);
        } catch (deleteError) {
          if (deleteError.code !== 550) { // 550 indica que el archivo no existe
            throw new Error(`Error al eliminar el archivo remoto: ${deleteError.message}`);
          }
          console.log(`Archivo remoto ${remoteFilePath} no existe, procediendo a la subida del nuevo archivo`);
        }

        // Subir el nuevo archivo
        await sftpClient.put(localFilePath, remoteFilePath);
        console.log(`Archivo ${archivoViejo} subido exitosamente al servidor`);

        // Eliminar archivo local después de subir
        fs.unlinkSync(localFilePath);
        console.log(`Archivo local ${localFilePath} eliminado exitosamente`);

      } catch (error) {
        console.error('Error durante la operación SFTP:', error);
        return res.status(500).json({ message: 'Error durante la operación de archivo' });
      } finally {
        await sftpClient.end();
      }
    }
    // Query para actualizar la patrimonio
    const sql =
      "UPDATE patrimonio SET nombre_patrimonio = ?, anio_emplazamiento = ?, descripcion = ?, origen = ?, id_categoria = ?, id_tipologia = ?, id_material = ?, id_estado = ?, id_autor = ?, id_ubicacion = ?, latylon = ?, habilita = ?, nombre_archivo = ? WHERE id_patrimonio = ?";
    const values = [
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
      habilita,
      nombre_archivo,
      id,
    ];
    // Verificar si la patrimonio ya existe con otra ID
    connection = await conectarSMTPatrimonio();
    const [patrimonio] = await connection.execute(
      "SELECT * FROM patrimonio WHERE (nombre_patrimonio = ? AND descripcion = ? AND id_categoria = ? AND id_tipologia = ? AND latylon = ? AND habilita = ?) AND id_patrimonio != ?",
      [
        nombre_patrimonio,
        descripcion,
        id_categoria,
        id_tipologia,
        latylon,
        habilita,
        id,
      ]
    );

    if (patrimonio.length === 0) {
      // No existe otra patrimonio con los mismos datos, se puede proceder con la actualización
      const [result] = await connection.execute(sql, values);
      console.log("Filas actualizadas:", result.affectedRows);
      res
        .status(200)
        .json({ message: "Patrimonio modificado con éxito", result });
    } else {
      // Ya existe otra patrimonio con los mismos datos, devolver un error
      res.status(400).json({
        message: "Ya existe un Patrimonio con los mismos datos",
        patrimonio: patrimonio[0],
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const listarPatrimonioBack = async (req, res) => {
  const connection = await conectarSMTPatrimonio();
  try {
    const [patrimonios] = await connection.execute(
      "SELECT patrimonio.*, ubicacion.nombre_ubicacion, tipologia.nombre_tipologia FROM patrimonio LEFT JOIN ubicacion ON patrimonio.id_ubicacion = ubicacion.id_ubicacion LEFT JOIN tipologia ON patrimonio.id_tipologia = tipologia.id_tipologia"
    );
    patrimonios.reverse();
    connection.end();
    res.status(200).json({ patrimonios });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });

    connection.end();
  }
};

const listarAutorPatrimonioBack = async (req, res) => {
  const connection = await conectarSMTPatrimonio();
  try {
    const [autores] = await connection.execute("SELECT * FROM autor");
    res.status(200).json({ autores });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const listarUbicacionPatrimonioBack = async (req, res) => {
  const connection = await conectarSMTPatrimonio();
  try {
    const [ubicaciones] = await connection.execute("SELECT * FROM ubicacion");
    res.status(200).json({ ubicaciones });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const listarEstadoPatrimonioBack = async (req, res) => {
  const connection = await conectarSMTPatrimonio();
  try {
    const [estados] = await connection.execute("SELECT * FROM estado");
    res.status(200).json({ estados });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const listarMaterialPatrimonioBack = async (req, res) => {
  const connection = await conectarSMTPatrimonio();
  try {
    const [materiales] = await connection.execute("SELECT * FROM material");
    res.status(200).json({ materiales });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const listarCategoriaPatrimonioBack = async (req, res) => {
  const connection = await conectarSMTPatrimonio();
  try {
    const [categorias] = await connection.execute("SELECT * FROM categoria");
    res.status(200).json({ categorias });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const listarTipologiaPatrimonioBack = async (req, res) => {
  const connection = await conectarSMTPatrimonio();
  try {
    const [tipologias] = await connection.execute("SELECT * FROM tipologia");
    res.status(200).json({ tipologias });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    connection.end();
  }
};

const deshabilitarPatrimonio = async (req, res) => {
  let connection;
  connection = await conectarSMTPatrimonio();
  
  try {
    const { id_patrimonio } = req.body;
    // console.log(req.body.id_patrimonio, "hola");
    if (id_patrimonio === undefined || req.body == "") {
      return res
        .status(400)
        .json({ message: "El ID de patrimonio es requerido" });
    }
  
    const sql = "UPDATE patrimonio set habilita = 0 WHERE id_patrimonio = ?";
    const values = [id_patrimonio];
   
    const [result] = await connection.execute(sql, values);
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "patrimonio deshabilitado con éxito" });
    } else {
      res.status(400).json({ message: "patrimonio no encontrada" });
    }
  } catch (error) {
    console.error("Error al eliminar el patrimonio:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
    // res.status(500).json({
    //   // message: `Error interno del servidor, ${req.body}`,
    //   message: `Error interno del servidor,AAAAAAAAAAH`,
    //   details: error.message,
    // });
  } finally {
    connection.end();
  }
};
//-----------PATRIMOINIO MUNICIPAL--------------

module.exports = {
  obtenerImagenes,
  agregarOpcion,
  borrarOpcion,
  agregarProceso,
  listarTipoContratacion,
  listarTipoInstrumento,
  agregarContratacion,
  agregarAnexo,
  listarContratacionBack,
  borrarContratacion,
  editarContratacion,
  listarContratacion,
  editarAnexo,
  listarContratacionPorId,
  agregarPatrimonio,
  agregarCategoriaPatrimonio,
  agregarEstadoPatrimonio,
  agregarAutorPatrimonio,
  agregarMaterialPatrimonio,
  agregarUbicacionPatrimonio,
  agregarTipologiaPatrimonio,
  listarPatrimonioBack,
  listarAutorPatrimonioBack,
  listarTipologiaPatrimonioBack,
  listarCategoriaPatrimonioBack,
  listarMaterialPatrimonioBack,
  listarEstadoPatrimonioBack,
  listarUbicacionPatrimonioBack,
  deshabilitarPatrimonio,
  editarPatrimonio,
  listarGenero,
  editarGenero,
  agregarGenero,
  agregarTipoDeUsuario,
  listarTiposDeUsuario,
  editarTipoDeUsuario,
  agregarTipoDoc,
  editarTipoDoc,
  listarTipoDoc,
  agregarReparticion,
  editarReparticion,
  listarReparticion,
  listarProcesos,
  actualizarPermisosTUsuario,
  listarPermisosPorTUsuarios,
  actualizarPermisosPorTUsuario,
  listarEmpleados,
  cambiarTipoDeUsuario,
  actualizarPermisosEspecificos,
  listarProcesosSinId,
  existeEnPermisosPersona,
};
