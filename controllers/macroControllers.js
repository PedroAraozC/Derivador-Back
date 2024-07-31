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
const streamifier = require("streamifier");
const bcrypt = require("bcryptjs");
const CustomError = require("../utils/customError");
const jwt = require("jsonwebtoken");

const obtenerCategorias = async (req, res) => {
  const connection = await conectarMySql();
  try {
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
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const obtenerTiposDeReclamoPorCategoria = async (req, res) => {
  const connection = await conectarMySql();
  try {
    const id_categoria = req.query.id_categoria;
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
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const ingresarReclamo = async (req, res) => {
  const connection = await conectarMySql();
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
// console.log("req.body", req.body)
    // console.log("foto", foto?.length);
    console.log("Conectado a MySQL");

    const [tipoDeReclamoPerteneceACategoria] = await connection.execute(
      "SELECT CASE WHEN COUNT(*) > 0 THEN 'true' ELSE 'false' END AS existe_tipo_reclamo FROM tipo_reclamo WHERE id_treclamo = ? AND id_categoria = ? AND habilita = ?",
      [id_treclamo, id_categoria, 1]
    );

    if (tipoDeReclamoPerteneceACategoria[0].existe_tipo_reclamo == "true") {
      if (
        coorde1 < -26.78530077380037 &&
        coorde1 > -26.892519689424365 &&
        coorde2 < -65.16780850068358 &&
        coorde2 > -65.26702877656248
      ) {
        console.log("---Coordenadas válidas---");

        const transaction = await sequelize_ciu_digital.transaction();

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

        if (req.body.foto?.length > 0) {
          try {
            const resUpdateImage = await guardarImagen(req.body, reclamoId);
            console.log(resUpdateImage);
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
          message:
            "Las coordenadas proporcionadas están fuera del rango permitido",
        });
      }
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
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const listarReclamosCiudadano = async (req, res) => {
  const cuit = req.query.cuit;
  const telefono = req.query.telefono;
  const connection = await conectarMySql();
  console.log("Conectado a MySQL");

  try {
    let sqlQuery = ` SELECT r.id_reclamo, tr.nombre_treclamo, r.asunto, r.direccion, r.apellido_nombre, r.fecha_hora_inicio, cr.nombre_categoria,(SELECT detalle_movi FROM mov_reclamo WHERE id_movi = (SELECT MAX(id_movi) FROM mov_reclamo WHERE id_reclamo = r.id_reclamo)) as estado_reclamo FROM reclamo_prueba r JOIN categoria_reclamo cr ON r.id_categoria = cr.id_categoria JOIN tipo_reclamo tr ON r.id_treclamo = tr.id_treclamo WHERE `;

    if (cuit && telefono) {
      sqlQuery += "r.cuit = ? AND r.telefono LIKE CONCAT('%', ?, '%')";
      const [reclamos] = await connection.execute(sqlQuery, [cuit, telefono]);

      if (reclamos.length > 0) {
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
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

const buscarReclamoPorId = async (req, res) => {
  const id_reclamo = req.query.id_reclamo;
  const connection = await conectarMySql();
  console.log("Conectado a MySQL");
console.log(req.query.id_reclamo)
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
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const obtenerTurnosDisponiblesPorDia = async (req, res) => {
  const connection = await conectarDBTurnos();
  try {
    console.log("Conectado a MySQL");

    let sqlQuery = `CALL api_obtenerturnospordia(?)`;
    const [results, fields] = await connection.execute(sqlQuery, [1]);

    await connection.end();
    res.status(200).json(results[0]);

    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error de servidor" });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const obtenerTurnosDisponiblesPorHora = async (req, res) => {
  const connection = await conectarDBTurnos();
  try {
    const fecha_solicitada = req.query.fecha_solicitada;

    console.log("Conectado a MySQL");

    let sqlQuery = `CALL api_obtenerturnosporhora(?, ?)`;

    const [results, fields] = await connection.execute(sqlQuery, [
      1,
      fecha_solicitada,
    ]);
    await connection.end();
    res.status(200).json(results[0]);

    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error de servidor" });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const existeTurno = async (req, res) => {
  const connection = await conectarDBTurnos();
  try {
    const cuil = req.query.cuil;
    // console.log(cuil);
    console.log("Conectado a MySQL");

    let sqlQuery = `CALL api_existeturno(?,?)`;
    const [results, fields] = await connection.execute(sqlQuery, [1, cuil]);

    await connection.end();
    res.status(200).json(results[0]);

    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error de servidor" });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const confirmarTurno = async (req, res) => {
  const connection = await conectarDBTurnos();
  try {
    const cuil = req.query.cuil;
    const apellido = req.query.apellido;
    const nombre = req.query.nombre;
    const fecha_solicitada = req.query.fecha_solicitada;
    const hora_solicitada = req.query.hora_solicitada;

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

    await connection.end();
    res.status(200).json(results[0]);

    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error de servidor" });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const anularTurno = async (req, res) => {
  const connection = await conectarDBTurnos();
  try {
    const cuil = req.query.cuil;

    // console.log(req.query);
    console.log("Conectado a MySQL");

    let sqlQuery = `SELECT api_anularturno(?, ?)`;
    const [results, fields] = await connection.execute(sqlQuery, [1, cuil]);

    await connection.end();
    res.status(200).json(results[0]);

    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error de servidor" });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const usuarioExistente = async (req, res) => {
  // VERIFICA SI EXISTE USUARIO POR CORREO O CUIT EN BD_MUNI
  const connection = await conectarBDEstadisticasMySql();
  try {
    const { cuit_persona, email_persona } = req.query;

    const [resultEmailyCuit] = await connection.query(
      "SELECT * FROM persona WHERE email_persona = ? OR documento_persona = ?",
      [email_persona, cuit_persona]
    );
    if (resultEmailyCuit.length > 0) {
      await connection.end();
      return res.status(400).json({
        message: "Datos ya registrados",
        userEmail: resultEmailyCuit[0].email_persona,
        userCuit: resultEmailyCuit[0].documento_persona,
      });
    } else {
      await connection.end();
      return res.status(400).json({
        message: "Datos no encontrados",
        userEmail: email_persona,
        userCuit: cuit_persona,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error de servidor" });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const tipoUsuario = async (req, res) => {
  const connection = await conectarBDEstadisticasMySql();
  try {
    const { cuit_persona } = req.query;

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
    await connection.end();

    return res.status(400).json({
      message: "Tipo de usuario",
      userTipoUsuario: resultTipo[0].nombre_tusuario,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error de servidor" });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const guardarImagen = async (body, idReclamo) => {
  const ftpClient = await conectarFTPCiudadano();
  const { fileTypeFromBuffer } = await import("file-type");

  try {
    const { foto } = body;
    const arrayFoto = Array.isArray(foto) ? foto : [foto];

    for (let index = 0; index < arrayFoto.length; index++) {
      const foto = arrayFoto[index];
      const extension = await getImageExtension(
        { fromBuffer: fileTypeFromBuffer },
        foto
      );
      const nombreArchivo = `${idReclamo}_${index + 1}.${extension}`;
      const base64Data = foto.replace(/^data:image\/\w+;base64,/, "");
      const imageData = Buffer.from(base64Data, "base64");
      const remoteFilePath = `/Fotos/${nombreArchivo}`;

      const stream = streamifier.createReadStream(imageData);
      await ftpClient.uploadFrom(stream, remoteFilePath);
      console.log(
        `Imagen ${nombreArchivo} subida correctamente a ${remoteFilePath}`
      );
    }

    console.log("Todas las imágenes se subieron correctamente");
    return {
      message: "Imágenes enviadas y subidas al servidor FTP correctamente",
    };
  } catch (error) {
    console.error("Error al guardar y subir las imágenes:", error);
    return { error: "Error al guardar y subir las imágenes" };
  } finally {
    await ftpClient.close();
    console.log("Conexión FTP cerrada correctamente");
  }
};

async function getImageExtension(fileType, base64String) {
  const buffer = Buffer.from(base64String, "base64");
  try {
    const type = await fileType.fromBuffer(buffer);
    return type ? type.ext : "png";
  } catch (error) {
    console.error("Error al obtener el tipo de imagen:", error);
    return "png";
  }
}

const existeLoginApp = async (req, res) => {
  let connection;
  console.log(req.params);
  try {
    connection = await conectarBDEstadisticasMySql();
    const userDNI = req.params.dni;
    const userPassword = req.params.password;

    const queryResult = await connection.query(
      "SELECT * FROM persona WHERE documento_persona = ?  ",
      [userDNI]
    );
    // console.log("QueryResult",queryResult)
    if (queryResult[0] == "") {
      throw new CustomError("Usuario no encontrado", 400);
    } else {
      const passOk = await bcrypt.compare(
        userPassword,
        queryResult[0][0].clave
      );
      if (!passOk) throw new CustomError("Contraseña incorrecta", 400);
    }

    const tokenIngreso = jwt.sign(
      { id: queryResult[0][0].id_persona },
      process.env.JWT_SECRET_KEY_INGRESO,
      {
        expiresIn: "1h",
      }
    );
    console.log("querryResult", queryResult[0]);
    // await connection.end();
    if (queryResult.length > 0) {
      const {
        documento_persona,
        apellido_persona,
        nombre_persona,
        id_genero,
        fecha_nacimiento_persona,
        telefono_persona,
        email_persona,
      } = queryResult[0][0];

      const ciudadano = [
        {
          cuit: documento_persona,
          apellido_persona,
          nombre_persona,
          id_genero,
          fecha_nacimiento_persona,
          telefono: telefono_persona,
          email: email_persona,
        },
      ]; // Suponiendo que solo hay un usuario con ese DNI
      console.log("ciudadano", ciudadano);

      if (ciudadano.length > 0) {
        res.status(200).json({
          message: "Ingreso correcto",
          ok: true,
          ciudadano,
          tokenIngreso,
        });
      } else {
        res.status(200).json({ message: "Usuario no encontrado" });
      }
    } else {
      res.status(200).json({ message: "Usuario no encontrado" });
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
const obtenerTokenAutorizacion = async (req, res) => {
  try {
    // console.log(req.query);
    const tokenIngreso = req.query.tokenIngreso;
    if (!tokenIngreso) {
      return res
        .status(400)
        .json({ message: "Token de ingreso no proporcionado" });
    }

    const decoded = jwt.verify(
      tokenIngreso,
      process.env.JWT_SECRET_KEY_INGRESO
    );

    const tokenAutorizacion = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "1h",
      }
    );
    res.status(200).json({ tokenAutorizacion });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al generar el token de autorización" });
  }
};

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
  existeLoginApp,
  obtenerTokenAutorizacion,
};
