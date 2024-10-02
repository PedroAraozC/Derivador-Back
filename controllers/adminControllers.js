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

    const sqlUpdate = "UPDATE persona SET id_tusuario = ? WHERE id_persona = ?";
    const valuesUpdate = [id, id_persona];

    // Conectar a la base de datos
    connection = await conectarBDEstadisticasMySql();

    // Ejecutar la consulta SQL para cambiar el tipo de usuario
    const [resultUpdate] = await connection.execute(sqlUpdate, valuesUpdate);

    if (resultUpdate.affectedRows > 0) {
      // Si el UPDATE fue exitoso, verificamos si el id_persona tiene permisos asignados
      const sqlCheckPermiso =
        "SELECT * FROM permiso_persona WHERE id_persona = ?";
      const [permisos] = await connection.execute(sqlCheckPermiso, [
        id_persona,
      ]);

      if (permisos.length > 0) {
        // Si existen permisos, los eliminamos
        const sqlDelete = "DELETE FROM permiso_persona WHERE id_persona = ?";
        await connection.execute(sqlDelete, [id_persona]);

        res.status(200).json({
          message: "Tipo de usuario modificado y permisos eliminados.",
        });
      } else {
        // Si no existen permisos, devolvemos un mensaje indicando que no había permisos
        res.status(200).json({
          message:
            "Tipo de usuario modificado, pero no había permisos para eliminar.",
        });
      }
    } else {
      res.status(404).json({
        message: "No se encontró la persona con el id proporcionado.",
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
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
  // const sql2 = "SELECT * FROM permiso_tusuario WHERE id_persona = ?";
  const values = [id];
  let connection;
  connection = await conectarBDEstadisticasMySql();
  if (id == undefined) {
    res.status(500).json("No llego el id");
    return;
  }
  try {
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
    await connection.beginTransaction(); // Comienza la transacción

    // Insertar el nuevo tipo de usuario
    const sqlInsertTUsuario =
      "INSERT INTO tipo_usuario (nombre_tusuario, observacion, habilita) VALUES (?, ?, ?)";
    const valuesTUsuario = [nombre_tusuario, observacion, habilita];
    const [resultTUsuario] = await connection.execute(
      sqlInsertTUsuario,
      valuesTUsuario
    );
    const nuevoIdTUsuario = resultTUsuario.insertId;

    // Obtener todos los procesos existentes
    const [procesos] = await connection.execute(
      "SELECT id_proceso FROM proceso"
    );

    // Crear las asociaciones en la tabla de permisos
    for (const proceso of procesos) {
      const sqlInsertPermiso =
        "INSERT INTO permiso_tusuario (id_proceso, id_tusuario, ver, agregar, modificar, habilita) VALUES (?, ?, ?, ?, ?, ?)";
      const valuesPermiso = [proceso.id_proceso, nuevoIdTUsuario, 0, 0, 0, 1];
      await connection.execute(sqlInsertPermiso, valuesPermiso);
    }

    // Confirmar la transacción
    await connection.commit();

    res
      .status(201)
      .json({ id: nuevoId, message: "Tipo de usuario creado con éxito" });
  } catch (error) {
    // Revertir la transacción en caso de error
    if (connection) await connection.rollback();
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    // Cerrar la conexión
    if (connection) connection.end();
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
      habilita,
    } = req.body;

    console.log(req);

    const nombre_archivo = nombre_patrimonio;

    const sql =
      "INSERT INTO patrimonio (nombre_patrimonio, anio_emplazamiento, descripcion, origen, id_categoria, id_tipologia, id_material, id_estado, id_autor, id_ubicacion, latylon, nombre_archivo, habilita) VALUES (?, ?, ?, ?, ?, ? , ?, ?, ?, ?, ?, ?, ?)";
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
      nombre_archivo,
      habilita,
    ];

    connection = await conectarSMTPatrimonio();
    const [patrimonio] = await connection.execute(sql, values);
    res.status(201).json({
      message: "Patrimonio subido con éxito",
    });
  } catch (error) {
    console.error("Error al subir el patrimonio:", error);
    if (error.response) {
      console.error("Error del servidor:", error.response.data);
    }
  }
};

const crearPatrimonioImagenes = async (req, res) => {
  let sftp;

  try {
    const { nombre_patrimonio } = req.body;
    const newImage = req.files;
    console.log(newImage);
    const archivosKeys = Object.keys(newImage);

    sftp = await conectarSFTPCondor();
    for (let key of archivosKeys) {
      let archivo = newImage[key];

      // Verificar si la clave corresponde a un archivo de carrousel

      if (key.includes("imagen_card")) {
        await procesarImagen(archivo, "_card", sftp, nombre_patrimonio);
      }
      if (key.includes("imagen_carrousel_1")) {
        await procesarImagen(archivo, "_1", sftp, nombre_patrimonio);
      }
      if (key.includes("imagen_carrousel_2")) {
        await procesarImagen(archivo, "_2", sftp, nombre_patrimonio);
      }
      if (key.includes("imagen_carrousel_3")) {
        await procesarImagen(archivo, "_3", sftp, nombre_patrimonio);
      }
    }

    res.status(200).json({ message: "Imagen actualizada correctamente." });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    if (sftp) sftp.end(); // Asegúrate de cerrar la conexión SFTP
  }
};
const obtenerImagenesPatri = async (req, res) => {
  let sftp;
  const nombreArchivo = req.query.nombreArchivo; // obtener el nombre base del archivo desde los parámetros de la consulta
  console.log(nombreArchivo, "Nombre archivo recibido");

  const archivosBuscados = [
    `${nombreArchivo}_card`,
    `${nombreArchivo}_1`,
    `${nombreArchivo}_2`,
    `${nombreArchivo}_3`
  ];

  try {
    // Conexión al servidor SFTP
    sftp = await conectarSFTPCondor();
    const remotePath = '/var/www/vhosts/cidituc.smt.gob.ar/Fotos-Patrimonio/'; // Cambia a la ruta donde están las imágenes

    // Obtener la lista de archivos en el directorio remoto
    const archivosRemotos = await sftp.list(remotePath);

    // Crear un objeto para almacenar las imágenes encontradas
    const imagenesEncontradas = {};

    // Filtrar archivos que coincidan con los nombres esperados en una sola pasada
    for (const archivoRemoto of archivosRemotos) {
      const nombreSinExtension = archivoRemoto.name.split('.')[0]; // Nombre sin la extensión

      // Si el nombre coincide con uno de los archivos buscados
      if (archivosBuscados.includes(nombreSinExtension)) {
        // Obtener el archivo como Buffer
        const remoteFilePath = `${remotePath}${archivoRemoto.name}`;
        const buffer = await sftp.get(remoteFilePath);
        
        // Convertir la imagen a base64
        const base64Image = buffer.toString('base64');

        // Guardar la imagen en el objeto
        imagenesEncontradas[nombreSinExtension] = {
          nombre: archivoRemoto.name,
          imagen: base64Image
        };
      }
    }

    // Si no se encontró ninguna imagen específica, buscar la imagen base
    if (Object.keys(imagenesEncontradas).length === 0) {
      const imagenBase = archivosRemotos.find(archivoRemoto => {
        const nombreSinExtension = archivoRemoto.name.split('.')[0];
        return nombreSinExtension === nombreArchivo; // Buscar la imagen base
      });

      if (imagenBase) {
        const remoteFilePath = `${remotePath}${imagenBase.name}`;
        const buffer = await sftp.get(remoteFilePath);
        const base64Image = buffer.toString('base64');
        imagenesEncontradas[nombreArchivo] = {
          nombre: imagenBase.name,
          imagen: base64Image
        };
      }
    }

    // Ordenar las imágenes encontradas según el orden de archivosBuscados
    const imagenesOrdenadas = archivosBuscados.map(nombreBuscado => imagenesEncontradas[nombreBuscado]).filter(Boolean);

    // Devolver las imágenes ordenadas
    res.json(imagenesOrdenadas);
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ error: "Error fetching images" });
  } finally {
    // Cerrar la conexión SFTP
    if (sftp) {
      sftp.end();
    }
  }
};

const obtenerImagenCard = async (req, res) => {
  let sftp;
  const archivosBuscados = req.query.archivosBuscados; // Recibe un array de nombres de archivos desde el frontend
  console.log(archivosBuscados, "Nombres de archivos recibidos");

  try {
    // Conexión al servidor SFTP
    sftp = await conectarSFTPCondor();
    const remotePath = '/var/www/vhosts/cidituc.smt.gob.ar/Fotos-Patrimonio/'; // Cambia a la ruta donde están las imágenes

    // Obtener la lista de archivos en el directorio remoto
    const archivosRemotos = await sftp.list(remotePath);

    // Crear un objeto para almacenar las imágenes encontradas
    const imagenesEncontradas = {};

    // Crear un conjunto para facilitar la búsqueda de imágenes
    const archivosRemotosSet = new Set(archivosRemotos.map(archivo => archivo.name.split('.')[0])); // Guardamos solo el nombre sin extensión

    for (const nombreArchivo of archivosBuscados) {
      const archivoEsperado = `${nombreArchivo}_card`;

      // Verificar si el nombre del archivo esperado está en el conjunto
      if (archivosRemotosSet.has(archivoEsperado)) {
        // Obtener el archivo que coincide con el nombre esperado, sin importar la extensión
        const archivoRemoto = archivosRemotos.find(archivo => archivo.name.startsWith(archivoEsperado));

        if (archivoRemoto) {
          const remoteFilePath = `${remotePath}${archivoRemoto.name}`;
          const buffer = await sftp.get(remoteFilePath);
          const base64Image = buffer.toString('base64');

          // Guardar la imagen en el objeto
          imagenesEncontradas[nombreArchivo] = { [archivoEsperado]: base64Image };
        }
      }
    }

    // Verificar si se encontraron imágenes
    if (Object.keys(imagenesEncontradas).length === 0) {
      return res.status(404).json({ error: "No se encontraron imágenes" });
    }

    res.json(imagenesEncontradas);
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ error: "Error fetching images" });
  } finally {
    if (sftp) sftp.end();
  }
};


// const obtenerImagenesPatri = async (req, res) => {
//   let connection;
//   try {
//     connection = await conectarSFTPCondor();
//     const { nombreArchivo } = req.query;
// console.log(nombreArchivo)
//     if (!nombreArchivo) {
//       return res.status(400).send("No image specified");
//     }

//     // Define los nombres de los archivos a buscar
//     const fileNames = [
//       `${nombreArchivo}_card`,
//       `${nombreArchivo}_1`,
//       `${nombreArchivo}_2`,
//       `${nombreArchivo}_3`
//     ].map(name => `${name}.jpg`); // Cambia la extensión según corresponda

//     console.log(`Requested file names: ${fileNames}`);

//     // Array para almacenar los streams de archivos
//     const fileStreams = [];

//     // Intenta obtener cada archivo
//     for (const fileName of fileNames) {
//       const remoteImagePath = `/var/www/vhosts/cidituc.smt.gob.ar/Fotos-Patrimonio/${fileName}`;
//       console.log(`Requested remote image path: ${remoteImagePath}`);

//       // Crea un flujo de lectura para el archivo
//       const fileStream = connection.createReadStream(remoteImagePath);

//       fileStream.on('error', (err) => {
//         console.warn("Image not found:", remoteImagePath, "Error details:", err);
//       });

//       // Almacena el flujo de archivos
//       fileStreams.push(fileStream);
//     }

//     // Espera a que todos los flujos de archivos estén listos
//     Promise.all(fileStreams.map(stream => new Promise((resolve, reject) => {
//       stream.on('data', () => resolve());
//       stream.on('error', () => reject());
//     })))
//     .then(() => {
//       // Envía los archivos como respuesta
//       res.setHeader('Content-Type', 'application/json');
//       res.send(fileStreams.map((stream, index) => {
//         return {
//           filename: fileNames[index],
//           stream: stream // Este campo se puede eliminar si solo necesitas los nombres
//         };
//       }));
//     })
//     .catch((error) => {
//       console.error("Error processing file streams:", error);
//       res.status(500).send("Internal server error");
//     });

//   } catch (error) {
//     console.error("Algo salió mal :(", error);
//     res.status(500).send("Internal server error");
//   }
// };

const editarPatrimonio = async (req, res) => {
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
      habilita,
      id_patrimonio,
      oldName,
    } = req.body;

    const nombre_archivo = nombre_patrimonio;

    const sql =
      "UPDATE patrimonio SET nombre_patrimonio = ?, anio_emplazamiento = ?, descripcion = ?, origen = ?, id_categoria = ?, id_tipologia = ?, id_material = ?, id_estado = ?, id_autor = ?, id_ubicacion = ?, latylon = ?, habilita = ? WHERE id_patrimonio = ?";
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
      id_patrimonio,
    ];

    connection = await conectarSMTPatrimonio();
    const [patrimonio] = await connection.execute(sql, values);
    res.status(201).json({
      message: "Patrimonio editado con éxito",
    });
  } catch (error) {
    console.error("Error al editar el patrimonio:", error);
    if (error.response) {
      console.error("Error del servidor:", error.response.data);
    }
  } finally {
    connection.end();
  }
};

const editarPatrimonioImagenes = async (req, res) => {
  let sftp;
  let db;
  db = await conectarSMTPatrimonio();

  try {
    const { id_patrimonio, nombre_patrimonio } = req.body;
    const newImage = req.files;
    console.log(newImage);
    const archivosKeys = Object.keys(newImage);

    // 1. Obtener la imagen actual del patrimonio de la base de datos
    const [patrimonio] = await db.query(
      "SELECT nombre_archivo FROM patrimonio WHERE id_patrimonio = ?",
      [id_patrimonio]
    );
    if (!patrimonio.length) {
      return res.status(404).json({ message: "Patrimonio no encontrado" });
    }

    sftp = await conectarSFTPCondor();
    for (let key of archivosKeys) {
      let archivo = newImage[key];

      // Verificar si la clave corresponde a un archivo de carrousel

      if (key.includes("imagen_card")) {
        await procesarImagen(archivo, "_card", sftp, nombre_patrimonio);
      }
      if (key.includes("imagen_carrousel_1")) {
        await procesarImagen(archivo, "_1", sftp, nombre_patrimonio);
      }
      if (key.includes("imagen_carrousel_2")) {
        await procesarImagen(archivo, "_2", sftp, nombre_patrimonio);
      }
      if (key.includes("imagen_carrousel_3")) {
        await procesarImagen(archivo, "_3", sftp, nombre_patrimonio);
      }
    }

    res.status(200).json({ message: "Imagen actualizada correctamente." });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    if (sftp) sftp.end(); // Asegúrate de cerrar la conexión SFTP
  }
};

async function procesarImagen(archivo, carrouselKey, sftp, nombre) {
  // Extraer la extensión del archivo original
  const extension = path.extname(archivo.originalFilename);
  const newFilename = `${nombre}${carrouselKey}${extension}`; // Agregar la extensión al nuevo nombre
  const newPath = path.join(__dirname, "../tempUploads/", newFilename);

  // Renombrar el archivo temporalmente
  await new Promise((resolve, reject) => {
    fs.rename(archivo.filepath, newPath, (err) => {
      if (err) {
        console.error(`Error renombrando el archivo ${carrouselKey}:`, err);
        return reject(err);
      }
      console.log(`Archivo ${carrouselKey} renombrado a: ${newFilename}`);
      resolve();
    });
  });

  // Subir el archivo al servidor SFTP
  const remotePath = `/var/www/vhosts/cidituc.smt.gob.ar/Fotos-Patrimonio/${newFilename}`;
  try {
    await sftp.fastPut(newPath, remotePath);
    console.log(
      `Archivo ${newFilename} subido al servidor SFTP en: ${remotePath}`
    );
  } catch (error) {
    console.error(`Error subiendo ${newFilename} al servidor SFTP:`, error);
    throw error;
  }
}
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
  let connection; // Inicializar la variable sin asignarle nada
  try {
    connection = await conectarSMTPatrimonio(); // Asignar conexión
    const [categorias] = await connection.execute("SELECT * FROM categoria");
    res.status(200).json({ categorias });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    // Verifica si la conexión fue establecida antes de intentar cerrarla
    if (connection) {
      await connection.end();
    }
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
  // obtenerImagenes,
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
  editarPatrimonioImagenes,
  crearPatrimonioImagenes,
obtenerImagenesPatri,
obtenerImagenCard
};
