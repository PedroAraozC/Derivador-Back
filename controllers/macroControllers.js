const fs = require("fs");
const path = require("path");
const {
  conectarBDEstadisticasMySql,
} = require("../config/dbEstadisticasMYSQL");
const { conectarMySql, conectarMacroMySql } = require("../config/dbMYSQL");
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
const QRCode = require("qrcode");

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
  const connection = await conectarMacroMySql();
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
    console.log("req.body", req.body);
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
  console.log(req.query.id_reclamo);
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

const credencial = async (req, res) => {
  let connection;
  let imagen;

  imagen =
    "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";

  try {
    const userCuil = req.params.dni;
    connection = await conectarBDEstadisticasMySql();
    const queryResult = await connection.query(
      "SELECT nombre_persona, apellido_persona, documento_persona, id_genero, fecha_nacimiento_persona FROM persona WHERE documento_persona = ? AND habilita = 1",
      [userCuil]
    );

    if (queryResult[0].length > 0) {
      const {
        nombre_persona,
        apellido_persona,
        documento_persona,
        id_genero,
        fecha_nacimiento_persona,
      } = queryResult[0][0];

      let ciudadano = queryResult[0];

      ciudadano[0] = {
        nombre: nombre_persona,
        apellido: apellido_persona,
        cuil: documento_persona,
        sexo: id_genero,
        nacimiento: fecha_nacimiento_persona,
      }; // Suponiendo que solo hay un usuario con ese DNI

      console.log(ciudadano.length > 0);
      if (ciudadano.length > 0) {
        console.log(ciudadano[0].documento_persona);
        const qrCodeDataUrl = await QRCode.toDataURL(
          `https://ciudaddigital.smt.gob.ar/#/verificacion/${userCuil}`
        );
        // console.log(qrCodeDataUrl);
        ciudadano[0].imagen = imagen;
        ciudadano[0].qr = qrCodeDataUrl;

        res.status(200).json({ ciudadano });
        // res.status(200)();
      } else {
        res.status(404).json({ message: "Usuario no encontrado" });
      }
    } else {
      res.status(404).json({ message: "Usuario no encontrado" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error de servidor" });
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
  credencial,
};
