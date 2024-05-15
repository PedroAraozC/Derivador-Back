const fs = require("fs");
const path = require("path");
const {
  conectarBDEstadisticasMySql,
} = require("../config/dbEstadisticasMYSQL");
const { conectarMySql } = require("../config/dbMYSQL");
const { conectarBaseDeDatos } = require("../config/dbSQL");
const { conectarDBTurnos } = require("../config/dbTurnosMYSQL");
const { sequelize_ciu_digital } = require("../config/sequelize");
const MovimientoReclamo = require("../models/Macro/MovimientoReclamo");
const Reclamo = require("../models/Macro/Reclamo");
const { conectarFTPCiudadano } = require("../config/winscpCiudadano");

const obtenerCategorias = async (req, res) => {
  try {
    const connection = await conectarMySql();
    console.log("Conectado a MySQL");

    const [results, fields] = await connection.execute(
      ` SELECT categoria_reclamo.id_categoria,categoria_reclamo.nombre_categoria FROM categoria_reclamo WHERE categoria_reclamo.habilita = 1 `
    );
    // console.log(fields);
    // Enviar la respuesta
    res.status(200).json({ results });

    // Cerrar la conexión al finalizar
    await connection.end();
    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error de servidor" });
  }
};

const obtenerTiposDeReclamoPorCategoria = async (req, res) => {
  try {
    const id_categoria = req.query.id_categoria;
    const connection = await conectarMySql();
    console.log("Conectado a MySQL");

    const [results, fields] = await connection.execute(
      "SELECT tipo_reclamo.id_treclamo,tipo_reclamo.corto_treclamo FROM tipo_reclamo WHERE tipo_reclamo.habilita = ? AND tipo_reclamo.id_categoria = ?",
      [1, id_categoria]
    );

    // console.log(fields);
    // Enviar la respuesta
    res.status(200).json({ results });

    // Cerrar la conexión al finalizar
    await connection.end();
    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error de servidor" });
  }
};

const ingresarReclamo = async (req, res) => {
  let transaction;
  try {
    const {
      id_categoria,
      id_treclamo,
      asunto,
      detalle,
      direccion,
      descripcion_lugar,
      coorde1,
      coorde2,
      apellido_nombre,
      telefono,
      email,
      cuit,
      foto,
    } = req.body;
    console.log(foto?.length);

    transaction = await sequelize_ciu_digital.transaction();

    const connection = await conectarMySql();
    console.log("Conectado a MySQL");

    const [tipoDeReclamoPerteneceACategoria] = await connection.execute(
      "SELECT CASE WHEN COUNT(*) > 0 THEN 'true' ELSE 'false' END AS existe_tipo_reclamo FROM tipo_reclamo WHERE id_treclamo = ? AND id_categoria = ? AND habilita = ?",
      [id_treclamo, id_categoria, 1]
    );

    if (tipoDeReclamoPerteneceACategoria[0].existe_tipo_reclamo == "true") {
      const [tipoDeReclamo, fieldsTipoDeReclamo] = await connection.execute(
        "SELECT tipo_reclamo.id_prioridad FROM tipo_reclamo WHERE tipo_reclamo.id_treclamo = ? AND tipo_reclamo.habilita = ?",
        [id_treclamo, 1]
      );

      const [derivacionReclamo, fieldsDerivacionReclamo] =
        await connection.execute(
          "SELECT derivacion_reclamo.* FROM derivacion_reclamo WHERE derivacion_reclamo.id_treclamo = ? AND derivacion_reclamo.habilita = ?",
          [id_treclamo, 1]
        );

      const reclamoObj = {
        id_categoria,
        id_oreclamo: 15,
        id_estado: 1,
        id_treclamo,
        asunto,
        detalle,
        direccion,
        descripcion_lugar,
        coorde1,
        coorde2,
        apellido_nombre,
        telefono,
        email,
        cuit,
        id_prioridad: tipoDeReclamo[0].id_prioridad,
        foto: foto?.length > 0 ? 1 : 0,
      };

      const nuevoReclamo = await Reclamo.create(reclamoObj, {
        transaction,
      });

      const reclamoId = nuevoReclamo.id_reclamo;

      await MovimientoReclamo.create(
        {
          id_reclamo: reclamoId,
          id_derivacion: derivacionReclamo[0].id_derivacion,
          id_oficina: derivacionReclamo[0].id_oficina_deriva,
          id_estado: 1,
          id_motivo: 1,
          detalle_movi: "Inicio del trámite",
          fecha_ingreso: "0000-00-00 00:00:00",
          fecha_egreso: "0000-00-00 00:00:00",
          oficina_graba: 5000,
        },
        { transaction }
      );

      const [oficinaYReparticion, fieldsOficinaYReparticion] =
        await connection.execute(
          "SELECT oficina_reparti.nombre_oficina,reparti.nombre_reparti FROM oficina_reparti JOIN reparti ON oficina_reparti.id_reparti = reparti.id_reparti WHERE oficina_reparti.id_oficina = ?",
          [derivacionReclamo[0].id_oficina_deriva]
        );

      await transaction.commit();

      if (req.body.foto.length > 0) {
        try {
          const mondongo = await guardarImagen(req.body, reclamoId);
          // connection.execute(
          //   `UPDATE reclamo SET foto = 1 WHERE id_reclamo = ?`,
          //   [reclamoId]
          // );
          console.log(mondongo, "mondongo");
        } catch (error) {
          console.error("Error:", error);
          res.status(500).json({ error: "Error de servidor imagenes" });
        }
      }

      res.status(200).json({
        message: "Reclamo generado con éxito",
        Numero_Reclamo: reclamoId,
        Estado: "Iniciado",
        Repartición_Derivada: oficinaYReparticion[0].nombre_reparti,
        Oficina_Receptora: oficinaYReparticion[0].nombre_oficina,
      });
    } else {
      res.status(400).json({
        message: "El tipo de reclamo y la categoría no se corresponden",
      });
    }

    await connection.end();
    console.log("Conexión cerrada");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const listarReclamosCiudadano = async (req, res) => {
  const cuit = req.query.cuit;
  const telefono = req.query.telefono;
  const connection = await conectarMySql();
  console.log("Conectado a MySQL");

  try {
    let sqlQuery = ` SELECT r.id_reclamo, tr.nombre_treclamo, r.asunto, r.direccion, r.apellido_nombre, r.fecha_hora_inicio, cr.nombre_categoria,(SELECT detalle_movi FROM mov_reclamo WHERE id_movi = (SELECT MAX(id_movi) FROM mov_reclamo WHERE id_reclamo = r.id_reclamo)) as estado_reclamo FROM reclamo_prueba r JOIN categoria_reclamo cr ON r.id_categoria = cr.id_categoria JOIN tipo_reclamo tr ON r.id_treclamo = tr.id_treclamo WHERE `

    if (cuit && telefono) {
      sqlQuery += "r.cuit = ? AND r.telefono LIKE CONCAT('%', ?, '%')";
      const [reclamos] = await connection.execute(sqlQuery, [cuit, telefono]);

       if (reclamos.length > 0) {
      //   for (const reclamo of reclamos) {
      //     // Consulta para obtener el estado (detalle_movi) de cada reclamo
      //     const detalleSqlQuery =
      //       "SELECT detalle_movi as estado_reclamo FROM mov_reclamo WHERE id_movi = (SELECT MAX(id_movi) FROM mov_reclamo WHERE id_reclamo = ?) AND id_reclamo = ?";
      //     const [detalleMovimiento] = await connection.execute(
      //       detalleSqlQuery,
      //       [reclamo.id_reclamo, reclamo.id_reclamo]
      //     );

      //     Verificar si detalleMovimiento tiene contenido antes de asignar su valor
      //     if (detalleMovimiento.length > 0) {
      //       reclamo.estado_reclamo = detalleMovimiento[0].estado_reclamo;
      //     } else {
      //       reclamo.estado_reclamo = "Estado no encontrado";
      //     }
      //   }
        await connection.end();

        res.status(200).json({ reclamos });
      } else {
        res.status(200).json({
          message:
            "No se encontraron reclamos asociados al CUIT y al Teléfono proporcionados.",
        });
      }
    } else if (cuit) {
      sqlQuery += "r.cuit = ?";
      const [reclamos] = await connection.execute(sqlQuery, [cuit]);

      if (reclamos.length > 0) {
        // for (const reclamo of reclamos) {
        //   // Consulta para obtener el estado (detalle_movi) de cada reclamo
        //   const detalleSqlQuery =
        //     "SELECT detalle_movi as estado_reclamo FROM mov_reclamo WHERE id_movi = (SELECT MAX(id_movi) FROM mov_reclamo WHERE id_reclamo = ?) AND id_reclamo = ?";
        //   const [detalleMovimiento] = await connection.execute(
        //     detalleSqlQuery,
        //     [reclamo.id_reclamo, reclamo.id_reclamo]
        //   );

        //   // Verificar si detalleMovimiento tiene contenido antes de asignar su valor
        //   if (detalleMovimiento.length > 0) {
        //     reclamo.estado_reclamo = detalleMovimiento[0].estado_reclamo;
        //   } else {
        //     reclamo.estado_reclamo = "Estado no encontrado";
        //   }
        // }
        await connection.end();

        res.status(200).json({ reclamos });
      } else {
        res.status(200).json({
          message:
            "No se encontraron reclamos asociados al CUIT proporcionado.",
        });
      }
    } else if (telefono) {
      sqlQuery += "r.telefono LIKE CONCAT('%', ?, '%')";
      const [reclamos] = await connection.execute(sqlQuery, [telefono]);

      if (reclamos.length > 0) {
        // for (const reclamo of reclamos) {
        //   // Consulta para obtener el estado (detalle_movi) de cada reclamo
        //   const detalleSqlQuery =
        //     "SELECT detalle_movi as estado_reclamo FROM mov_reclamo WHERE id_movi = (SELECT MAX(id_movi) FROM mov_reclamo WHERE id_reclamo = ?) AND id_reclamo = ?";
        //   const [detalleMovimiento] = await connection.execute(
        //     detalleSqlQuery,
        //     [reclamo.id_reclamo, reclamo.id_reclamo]
        //   );

        //   // Verificar si detalleMovimiento tiene contenido antes de asignar su valor
        //   if (detalleMovimiento.length > 0) {
        //     reclamo.estado_reclamo = detalleMovimiento[0].estado_reclamo;
        //   } else {
        //     reclamo.estado_reclamo = "Estado no encontrado";
        //   }
        // }
        await connection.end();

        res.status(200).json({ reclamos });
      } else {
        res.status(200).json({
          message:
            "No se encontraron reclamos asociados al Teléfono proporcionado.",
        });
      }
    } else {
      res.status(400).json({
        message:
          "Debe proporcionar al menos el CUIT o el Teléfono para buscar reclamos.",
      });
    }
    await connection.end();
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const buscarReclamoPorId = async (req, res) => {
  const id_reclamo = req.query.id_reclamo;
  const connection = await conectarMySql();
  console.log("Conectado a MySQL");

  try {
    let sqlQuery =
      "SELECT r.id_reclamo, tr.nombre_treclamo, r.asunto, r.direccion, r.apellido_nombre, r.fecha_hora_inicio, cr.nombre_categoria FROM reclamo_prueba r  JOIN categoria_reclamo cr ON r.id_categoria = cr.id_categoria JOIN tipo_reclamo tr ON r.id_treclamo = tr.id_treclamo WHERE r.id_reclamo = ? ";

    const [reclamo] = await connection.execute(sqlQuery, [id_reclamo]);

    if (reclamo.length > 0) {
      const detalleSqlQuery =
        "SELECT detalle_movi as estado_reclamo FROM mov_reclamo WHERE id_movi = (SELECT MAX(id_movi) FROM mov_reclamo WHERE id_reclamo = ?) AND id_reclamo = ?";
      const [detalleMovimiento] = await connection.execute(detalleSqlQuery, [
        id_reclamo,
        id_reclamo,
      ]);

      if (detalleMovimiento.length > 0) {
        reclamo[0].estado_reclamo = detalleMovimiento[0].estado_reclamo;
      } else {
        reclamo[0].estado_reclamo = "Estado no encontrado";
      }
      await connection.end();
      res.status(200).json({ reclamo });
    } else
      res.status(200).json({ message: "no se encontro un reclamo con ese id" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const obtenerTurnosDisponiblesPorDia = async (req, res) => {
  try {
    const connection = await conectarDBTurnos();

    console.log("Conectado a MySQL");

    let sqlQuery = `CALL api_obtenerturnospordia(?)`;
    const [results, fields] = await connection.execute(sqlQuery, [1]);

    connection.close();
    res.status(200).json(results[0]);

    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error de servidor" });
  }
};

const obtenerTurnosDisponiblesPorHora = async (req, res) => {
  try {
    const fecha_solicitada = req.query.fecha_solicitada;
    const connection = await conectarDBTurnos();

    console.log("Conectado a MySQL");

    let sqlQuery = `CALL api_obtenerturnosporhora(?, ?)`;

    const [results, fields] = await connection.execute(sqlQuery, [
      1,
      fecha_solicitada,
    ]);
    connection.close();
    res.status(200).json(results[0]);

    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error de servidor" });
  }
};

const existeTurno = async (req, res) => {
  try {
    const cuil = req.query.cuil;
    const connection = await conectarDBTurnos();
    // console.log(cuil);
    console.log("Conectado a MySQL");

    let sqlQuery = `CALL api_existeturno(?,?)`;
    const [results, fields] = await connection.execute(sqlQuery, [1, cuil]);

    connection.close();
    res.status(200).json(results[0]);

    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error de servidor" });
  }
};

const confirmarTurno = async (req, res) => {
  try {
    const cuil = req.query.cuil;
    const apellido = req.query.apellido;
    const nombre = req.query.nombre;
    const fecha_solicitada = req.query.fecha_solicitada;
    const hora_solicitada = req.query.hora_solicitada;

    const connection = await conectarDBTurnos();
    // console.log(req.query);
    console.log("Conectado a MySQL");

    let sqlQuery = `SELECT api_confirmarturno(?, ?, ?, ?, ?, ?, ?  )`;
    const [results, fields] = await connection.execute(sqlQuery, [
      1,
      cuil,
      apellido,
      nombre,
      fecha_solicitada,
      hora_solicitada,
      " ",
    ]);

    connection.close();
    res.status(200).json(results[0]);

    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error de servidor" });
  }
};

const anularTurno = async (req, res) => {
  try {
    const cuil = req.query.cuil;

    const connection = await conectarDBTurnos();
    // console.log(req.query);
    console.log("Conectado a MySQL");

    let sqlQuery = `SELECT api_anularturno(?, ?)`;
    const [results, fields] = await connection.execute(sqlQuery, [1, cuil]);

    connection.close();
    res.status(200).json(results[0]);

    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error de servidor" });
  }
};

const usuarioExistente = async (req, res) => {
  // VERIFICA SI EXISTE USUARIO POR CORREO O CUIT EN BD_MUNI
  try {
    const { cuit_persona, email_persona } = req.query;

    const connection = await conectarBDEstadisticasMySql();

    const [resultEmailyCuit] = await connection.query(
      "SELECT * FROM persona WHERE email_persona = ? OR documento_persona = ?",
      [email_persona, cuit_persona]
    );
    if (resultEmailyCuit.length > 0) {
      connection.close();
      return res.status(400).json({
        message: "Datos ya registrados",
        userEmail: resultEmailyCuit[0].email_persona,
        userCuit: resultEmailyCuit[0].documento_persona,
      });
    } else {
      connection.close();
      return res.status(400).json({
        message: "Datos no encontrados",
        userEmail: email_persona,
        userCuit: cuit_persona,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error de servidor" });
  }
};

const tipoUsuario = async (req, res) => {
  try {
    const { cuit_persona } = req.query;
    const connection = await conectarBDEstadisticasMySql();

    const [resultCuit] = await connection.query(
      "SELECT id_tusuario FROM persona WHERE documento_persona = ?",
      [cuit_persona]
    );
    const tipo = resultCuit[0].id_tusuario;

    const [resultTipo] = await connection.query(
      "SELECT nombre_tusuario FROM tipo_usuario WHERE id_tusuario = ?",
      [tipo]
    );
    // console.log(tipo, "aaa", resultTipo, "bbb");
    connection.close();

    return res.status(400).json({
      message: "Tipo de usuario",
      userTipoUsuario: resultTipo[0].nombre_tusuario,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error de servidor" });
  }
};

const guardarImagen = async (body, idReclamo) => {
  try {
    const { foto } = body;
    const arrayFoto = Array.isArray(foto) ? foto : [foto];
    const imagesArray = [];

    const ftpClient = await conectarFTPCiudadano();

    for (let index = 0; index < arrayFoto?.length; index++) {
      const foto = arrayFoto[index];
      const extension = getImageExtension(foto);

      const nombreArchivo = `${idReclamo}_${index + 1}.${extension}`;
      const base64Data = foto.replace(/^data:image\/\w+;base64,/, "");
      const imageData = Buffer.from(base64Data, "base64");

      imagesArray.push({ name: nombreArchivo, data: imageData });
    }

    for (const image of imagesArray) {
      const remoteFilePath = `/Fotos/${image.name}`;

      // Guardar la imagen localmente
      const localFilePath = path.join("./tempUploads", image.name);
      fs.writeFileSync(localFilePath, image.data);

      // Subir la imagen al servidor FTP
      await ftpClient.uploadFrom(localFilePath, remoteFilePath);
      console.log(
        `Imagen ${image.name} subida correctamente a ${remoteFilePath}`
      );

      // Eliminar la imagen local después de subirla
      fs.unlinkSync(localFilePath);
    }

    await ftpClient.close();
    console.log("Conexión FTP cerrada correctamente");

    return {
      message: "Imágenes enviadas y subidas al servidor FTP correctamente",
    };
  } catch (error) {
    console.error("Error al guardar y subir las imágenes:", error);
    return { error: "Error al guardar y subir las imágenes" };
  }
};

function getImageExtension(base64String) {
  // Decodificar la cadena base64
  const binaryString = atob(base64String);

  // Convertir la cadena binaria a un array de bytes
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Leer los primeros bytes
  const header = bytes.subarray(0, 4);

  // Identificar el tipo de imagen basado en los primeros bytes
  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
    // El formato JPEG y JPG comparten el mismo encabezado
    return "jpeg";
  } else if (
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47
  ) {
    return "png";
  } else if (
    header[0] === 0x47 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x38
  ) {
    return "gif";
  } else if (
    binaryString.startsWith("<?xml") ||
    binaryString.includes("<svg")
  ) {
    return "svg";
  } else {
    return "png";
  }
}

module.exports = {
  obtenerCategorias,
  obtenerTiposDeReclamoPorCategoria,
  ingresarReclamo,
  listarReclamosCiudadano,
  buscarReclamoPorId,
  obtenerTurnosDisponiblesPorDia,
  obtenerTurnosDisponiblesPorHora,
  existeTurno,
  confirmarTurno,
  anularTurno,
  usuarioExistente,
  tipoUsuario,
  guardarImagen,
};
