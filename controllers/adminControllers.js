const { conectarBDEstadisticasMySql } = require("../config/dbEstadisticasMYSQL");
const { conectarSMTContratacion } = require("../config/dbEstadisticasMYSQL");
const { sequelize_ciu_digital_derivador } = require("../config/sequelize");
const Proceso = require("../models/Derivador/Proceso");
const PermisoTUsuario = require("../models/Derivador/PermisoTUsuario");
const PermisoPersona = require("../models/Derivador/PermisoPersona");

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
      habilita
    } = req.body;

    // const archivo = req.file;

    // if (!archivo) {
    //   return res.status(400).json({ message: "Por favor, adjunta un archivo" });
    // }

    // // Obtener el nombre del archivo cargado
    // const nombre_archivo = archivo.originalname;
    
    // Obtener el último id_contratacion de la tabla
    const connection = await conectarSMTContratacion();
    const [lastIdResult] = await connection.query("SELECT MAX(id_contratacion) AS max_id FROM contratacion");
    let nextId = lastIdResult[0].max_id + 1; // Generar el próximo id_contratacion
    // Query para insertar una nueva convocatoria
    const sql =
      "INSERT INTO contratacion (id_contratacion, fecha_apertura, hora_apertura, fecha_presentacion, hora_presentacion, nombre_contratacion, id_tcontratacion, num_instrumento, id_tinstrumento, expte, valor_pliego, habilita) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
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
    ];
console.log(values)
    // Ejecutar la consulta SQL para insertar la nueva convocatoria
    await connection.execute(sql, values);

    res.status(201).json({ message: "Convocatoria creada con éxito", id: nextId, num_contratacion: nextId });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};
//-----------CONTRATACIONES--------------


module.exports={ agregarOpcion, borrarOpcion, agregarProceso, listarTipoContratacion, listarTipoInstrumento, agregarContratacion}