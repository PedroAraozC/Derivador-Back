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
const fs = require("fs");

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

const funcionPrueba = async (req, res) => {
  
  try {
    const telefono = req.query.telefono;
    const cuil = req.query.cuil;  
    const connection = await conectarBDEstadisticasMySql();
 console.log(cuil, "cuil");
      const [results, fields] = await connection.execute (
      ` SELECT * FROM persona WHERE documento_persona = ? AND telefono_persona = ?` , [cuil, telefono]  
      )
res.status(200).json({results})
   
    console.log(results, "results");
    await connection.end();
    console.log("conexión cerrada");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error de servidor" });
    
  }
}

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

    const mondongo = await guardarImagen(req.body);
    console.log(mondongo, "mondongo");

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
    let sqlQuery =
      "SELECT r.id_reclamo, tr.nombre_treclamo, r.asunto, r.direccion, r.apellido_nombre, r.fecha_hora_inicio, cr.nombre_categoria FROM reclamo_prueba r JOIN categoria_reclamo cr ON r.id_categoria = cr.id_categoria JOIN tipo_reclamo tr ON r.id_treclamo = tr.id_treclamo WHERE ";

    if (cuit && telefono) {
      sqlQuery += "r.cuit = ? AND r.telefono LIKE CONCAT('%', ?, '%')";
      const [reclamos] = await connection.execute(sqlQuery, [cuit, telefono]);

      if (reclamos.length > 0) {
        for (const reclamo of reclamos) {
          // Consulta para obtener el estado (detalle_movi) de cada reclamo
          const detalleSqlQuery =
            "SELECT detalle_movi as estado_reclamo FROM mov_reclamo WHERE id_movi = (SELECT MAX(id_movi) FROM mov_reclamo WHERE id_reclamo = ?) AND id_reclamo = ?";
          const [detalleMovimiento] = await connection.execute(
            detalleSqlQuery,
            [reclamo.id_reclamo, reclamo.id_reclamo]
          );

          // Verificar si detalleMovimiento tiene contenido antes de asignar su valor
          if (detalleMovimiento.length > 0) {
            reclamo.estado_reclamo = detalleMovimiento[0].estado_reclamo;
          } else {
            reclamo.estado_reclamo = "Estado no encontrado";
          }
        }
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
        for (const reclamo of reclamos) {
          // Consulta para obtener el estado (detalle_movi) de cada reclamo
          const detalleSqlQuery =
            "SELECT detalle_movi as estado_reclamo FROM mov_reclamo WHERE id_movi = (SELECT MAX(id_movi) FROM mov_reclamo WHERE id_reclamo = ?) AND id_reclamo = ?";
          const [detalleMovimiento] = await connection.execute(
            detalleSqlQuery,
            [reclamo.id_reclamo, reclamo.id_reclamo]
          );

          // Verificar si detalleMovimiento tiene contenido antes de asignar su valor
          if (detalleMovimiento.length > 0) {
            reclamo.estado_reclamo = detalleMovimiento[0].estado_reclamo;
          } else {
            reclamo.estado_reclamo = "Estado no encontrado";
          }
        }
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
        for (const reclamo of reclamos) {
          // Consulta para obtener el estado (detalle_movi) de cada reclamo
          const detalleSqlQuery =
            "SELECT detalle_movi as estado_reclamo FROM mov_reclamo WHERE id_movi = (SELECT MAX(id_movi) FROM mov_reclamo WHERE id_reclamo = ?) AND id_reclamo = ?";
          const [detalleMovimiento] = await connection.execute(
            detalleSqlQuery,
            [reclamo.id_reclamo, reclamo.id_reclamo]
          );

          // Verificar si detalleMovimiento tiene contenido antes de asignar su valor
          if (detalleMovimiento.length > 0) {
            reclamo.estado_reclamo = detalleMovimiento[0].estado_reclamo;
          } else {
            reclamo.estado_reclamo = "Estado no encontrado";
          }
        }
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

const arrayFoto = [
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOsAAADrCAYAAACICmHVAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAG6fSURBVHhe7b0HnFzXdR98X58+s70vsMACRGPvRSTVKJGqtCTbsizH+eQ4yc+y5JLYivN9sRIrtpVIkWxFiuIm25JVLNlWb6RIip0EOwCiEL3sYvv0ef1953/ve7sLkCIWwO7Ozu78d++8dufNu+ee/z3n1icFQcCaaKKJlQ853DbRRBMrHE2yNtFEg6BJ1iaaaBA0ydpEEw2CJlmbaKJB0CRrE000CJpkbaKJBkGzn7UJDtIDiTaRPszqhSThNAvmbZsKUyc0ybqGQXkvO46jeZ6biMe0TMBqaRa4McY8nTFfoUCxFJeCwyTdlFis5DhBkTSmqmmaQ8RFhCaWCU2yrkF4nqc6jp2KGXJ34E9t9O1jV7jmwSus8oEtVu14v+dOpyXJVBhxUWaqp6ptJS02fFJNbNunxjc9K+s9z1eq2kHGjNOJRLKsKIoX3rqJJUSTrGsIrutqtm1m4nFng+/sv80s/uCttdL9VwbeyYwSkPEUnrAIEhlUCjKdkwOV/F+V2URdi5HBNXpKqeztzyQSb/q2qu74qW3rx2VZKZC1tfkPNbEkaJJ1DcD3fdmyzGzMsLe49otvrBa+8y6rdO+lCjspqXKBKYFF9CQ9CNDeKDOf6qcBVU3xJ5OjK/sSk2jHU3wiLGN2oDOPtdLeoBOL3XQwnXvbt/X4Vd9z3fgLqqoVm/XapUGTrKscsKbl0nRfKj7yttLMN37Nqt1DJD0hKX6Bqb5NdjJgKu8U8ImkHpGU9uiQE5bIq9CB4pGOEFkDIiscY48Z9C2D9mkrIbS6eux1u1Kt7/9ryxv6lq6nTpNrTKa5icXEiiArPYMEpcIWrlSzZF4cUL1Un5o8ubU9uffXytNfep9pPtciS6NMU0tMo/qoJsnk4irMd8lyEv08IqsPUnKyUr7QPUBWlU4EAchM18Bm+g6ZWv4bAX3HI8q7XjuT9BvG0+2/9o+md9XnE8m2A6qqOjxSE4uCFUFW07RSdqBtL1tepxpUDwaOnU+lkqV4LFaTZbnZeHEBsKkiOTF25PKO1GMfrk5+/t3MP27IksVkxSZimizwXdpSfVQOTSnt+xQYidunAE7iEO29xEfshh8EqAzO0xY9OlRfJaLrrOYmmK/tKKbbP/Bd07v9k6l0z64mYRcPykc/+tFwt344fnJ08w+eyf/+hz/z6EefOCq/JUh0XJJMxTJmJa+W8nmVFEJSVNUl4ja7ChYA8lLUifGjl7WnH/3d6tTnf1FjBzSZTRGxiKzEPt5nSv9ESSIlBTnglpQDwqYCHIc8ECF5cT57gv4pyPShyuQiIz65yRJzmKo5zPMLRrV6fDiZau007a69mpaYpHyrv0VYBVgRlnXnc/ve9BePKZ/85tPOdlNqpVJfZbpvsqGcU7zz2sxTb7kh88NOI/9YTHKP5bKZfDwerzSJ+8pAY9LM9Ohw2njiw6WJ//UB2d1vxOQSkcphPuW1C3cXEcmYSiptiXhB5LuQOUVjEqgFXnKaYoesLznA/Ps+xYHGIJ5C+4of0K2IrCA8xfOUGLPcdrK0W4rprn/zNU9+/Z8kEi1Hm1Wbi0fdLSspl2IrqVv+9FsT75vwejVTamNuQO6UkmElM248e6g49M+PHHvjfbuL7zSl3GXtbemYb5fsWrXCyMXyVLXZkDEftVq5LRk78N7S+Gf+re88n9aVIpXIDtoFOMm4ZQyrnD4Vdx4RFZ4wd2lDbnL3mOqp9Enf43kkzlJEBdZUUYj8iohH52BlPYooKzhDBYJrE8/LBvPyPbHkkO0FXc8rimbi55u4cNSdrMVSuf35MenNf3e/+XqLtVDhTsU9jCb9B6QQpkx1ISXFxqxk/KED1uavPjR551NHg7sS6cxgd4sWBE7NdhzHR91orZfe5P7qmlK6vTr+qd8MnJ9uUMmiMmaR2xqKRTCRkxJATZV4O2tJecB12vIoIYNBbJzjAHvDAGKSPaV8osyiOPgOCgWF9hXZYp4zmWae2jJd6j6RTHW91PSGLg51J+vxU2ObHjoWf899e4KtnpIGRwkeL8XRqeAxjVyqGHOlFLlZaWYGcfnElJ/7yXMzV3/rkdNvHc0H1/Z1ZzXmlk3HMj1NU521qBRoSZ+ZPj2suQ/9G6v0N3dK0hgR0SELyK8Kts0ybu7wlQJHSNS5E3PXRZh3/WUB9WKXgs98181lWzYxy+t7SjcSebraxAWi7mTdf3j06q89pb3/pQm9zZdjok6ERovIzUKhTed4iyQ652F5FYM5FHfGjenPHLfXf/2R8TftHvHf0NGRaZWdguVaVRtjV9U1NAzOdZ1YIjZ5R3n8b3898F/MyKxCciPXFOThNq8ekJnjMdX19fhkoW0kkxt8odnYdOGoK1n5GFUle+vHvzn9S2U/q/joouf9d/C7iJgouEnZuL6FpTY8MNSPXKpTOUxnNlndGkvKR2dY27ceH73lyZfKd2Zz2XWqV6z5dpUPOCcXedXXa/P5iSEleOJ91fzXb9PkKSKqSeKaxwsuxGUGZR4cZcerZto6LzPdYN2jmhaDb97EBaCuZM0XS527RuW3/MND1q22nOEucCALokZ6hi4FmMeoHx6XZbCYc5pOyhp9RyOF0Jjtx9h4xUj95OnpKx7aY91pJFs3GUG+Jrm1sr6KSRsE5JMY1nXl/F/+qu/t7NIUWFWqSuBiRNI6kBVUlWW0P9vkJrX7hcrAoXSmex/vOmrivFFXsh4/Obbp4YPGux/YJ1/iSgnR18dNKQWQFccK7aCLgTYBsTnwRRcChsIFnMGIRMwNKJIW5/VbJ0iwvJWMP7LX2v7YQftNWip5iUGqAtJqquauNtKaZjXDgr13FWY+8x5dHlXUAAPwSXQo2TjoAGKqA8QsOpc5rma0dt00Ksn9D5Mr3GzBvwBEuVkXTOTLfTv3FbdJfKwpaRNvVCLggw4xeBzdDpKPUTekgKSBsiLTViUloMIa8TA+hrKe85tMsO+rzFWTrCyl2JSXYc+Nplv+3y/NvPvf/539ha/tTnx6vKa+tVSurjNNM46fWg2YmZnodc39l8lsWkflQKJSDX2fqDOEHTZ1A/JFQe+ucyznWIc3m2a5PbzUxHmibmRFN0O2b2PfrsO1gQBWEY1I3EoKiF0iq+8zlUiooXGJ4vC+QdI/MrCc0DAeGIwuo3PeA7lhfumfXGRfJysba2E1o5ftnsq1/uHXpt5913878IXP3Vv53K5Dk3eOjU/0OI6j45caGWat2GXbhzeqsnB9eeDeBwmO5HFG3XWZgQZClX5fZSaVuyc7yqXxdeGlJs4TdSMr1Vc7jowFm4uWYaDzHQoWEZArlw9FIwIyjSmeziSPrCmRlUdE5yAFDDhHHx+srhLYTJVs2rqc4JGCwmW2idGmkmFVaYAdKQ0l//ib7K4P/r30Fz/aF//j42P566rVapJHbkBgUMnguly7VTvex6vyYYj4Oa/8qw+IrJKHQRRUfXFOtVjmVH94pYnzRN3IOjlT6tw3yjZaLE56JTSK6xeRC9ZRkA2fEtVDyZqSBvq8eTjSRH6FEkABbh+/JKzvmfpJR+QyY4CF6ytUvseYHe9ge2da2n7v70f/1ad+UP30MwfG3z41PdPheaRVDQaQlQWVdOCV0iCFhEH5QnQiEFDG1Q0oUalqgjwK/Ml0b2+2g87W84kaFnW0rGbX04ecTQ6fD0knOAkjoqFRQhDSI9fO0Vyqh3rMVzB9C9eEu8u5y5WTHC0EssJwuAI4xrgpvwVtEQdfIyqiEcuiAqFK8fJBh/TlJ+Wr//A78icePqb9/th06dJKpZqimA0D3/eUILDigVczmK/RCfLqA1QM5pJfN4ColCcSQ00DVZhSLAjyWV7ANHHeqAtZ0b/a2TfU99zh6npX0rnl5FaTI9QurmWUp3ysG+1HSsdJiAOQVKZdmbgoMxeB4nkUojthhxMalVwXlpgCWpbppC+rzNOzrKp0sSdPpHo/9BenP/Sn3yp//skXx94V1mVJ81c+ggCW1TZ831KRVsxP5WN6kdpIZnUE8gIFpJgIUNOCoBYPM7CJ80RdyFosV9oOTnnD40U/4cA9RSvwGdmHxxJkFIvszQu8tMY1KqlBTvquSz4wlhzxlYAuU6B7ccWFNeWtUR5T6DzGrKIRimsPkdz1PGbZHjODBJsOerQvPS5d/3tfcz/1o73ax0+M568vVyppPM1KBmoNlCAqqlDHp0Ck4KewR5v60oJkL2HsMD0XAhc8UNeHalhA85cdE5MzPXuO2VtccpFckIaTFRkrFA3NSnwkE4plgDSODzUUUXg4A4gbERyKAF0IA4yyTKqMmSFowQowzQSB7iFrKpOMOBHeYGU3zkqsne2bybb83t+d+uU/+ufK504WYu+tVs1e13Vhj1ckKG0euQu2RJVCCd2XnBQQmSgA60pYiJyex5dsHiRZJefHsOnRUIw2cZ6oC1knef/q5DY++ogrFciJK2BhRFhxhD51MT74zMApjS2ynQdoRvglCrgLCgDOYxQI5AZ7aCVWFCZTAHF9m+I4FJf8cAn9txq55OQaF5Vu6Z9265e+93+P/sk3nrY/NjpZuGqlthiDrJKkmoqsOZJMiZFcnu6lBTJrfvhZEBkUYBQTlSmynDBlKVakk0v9gKsSy05Wcj21FNVXnz1SHuRd98g2WD1yb4XV5B8iMvAKunC2MvLDKJwBco3pfugSklUxmAINTzgGmTEIQ6KaKQJ+1ibDZAcqc5Q0KwUtbM9UuvX3vzj6K5/+bvEzzx2YePv0zEy77/M1UFYMZFlxJZYuSkpbUaI6PowWWskjGYrPMzFLM7oYhZdjfp7MxeFeD2/Eo4I2QBBVk7PjRd/nW/6p0bO2lWwnM9GciH5hWHbFKxRKHcfGgk3TtVgMVpWvAcSzDm4uhVllgzmlS7h8VkDcyM2jXY5olysM38cn3QAFAf2DoNzw8mO6StYWMQI6iYADTMvzScF8X6PrBj1Fkk2yAeX/PpG87g++a3ziiVPx350pVTdifSP6xooAWVYfBNC1TafkwKDEgE58SgTtI22UMCE0nl4e6AMZHwV+DnKjEEHIWnwjiod9tLT7RDwv0Gmr0zFqCJCliBfdS8QlYlPZJvlU3fBTTJH7ZwoF5yRdnPdLTSwUIg+WEWOT+Z4Xjgfb7CBBGQ7LCqaEGUwaIqE05llJ50FYuiAU58xwBnA8P8ziZSdehpd/TRQEEA0U0ZXjrKq0sseOGr0f+stTH/zio9WPHx/P37SCuniC6enSuB4bPux4JDsqhPg0QyIp1kcS81npA7LmqYTM6frLhAjgXHSeMoE3DGHLj0LBI1CByq9FdWS09XJfJbwe5iHPP1xDAZj2JWXdeCrdfYxHa+K8sexkncxX+p7cV9rq8cEQ6BeNlAOAEpFbhS4bnuHzr9UHGA0lI6gpNlrtTP3pP1Xe+cnv2v/r6X3jd8/M5Nsw6TuMWjdkcx2jSnx4j6ekXDSWBbB4vNALSUPAoJCALG/gI2DeMFlGkjX8GJEHcGcRMPQzdGvxPbqFS8HnlX+q73PLjYXXahRMKhscioMWX8SBX4SqBtxxykEiKv0sXSdHROkvKfqmQ7F4ZowuNXEBQA4sG1zX1XP9GweeO1Jb57IYZXDUyArrStoRKhbPeWhJCGR8vSDcaYXBajlSgtXUdunrj5tXfvw7zh8/d1L/ULFcG0S/sYhdHyQSybztde7W4lcec8ndDBRyO1G9QOs3kYuvYBjKWDTekXWFBQaBsc/PCbHPZYIAjvgIMgri2xgthm+BjGHe0Acfd4I4oTXlRQDPR6z2kWRqfMdxpgzvVNXmWkwXimUl60yh1Hl03NtYNBXZ4SU7/TxlPOqoUIKXgTKbu8d1BCwUH9FHVsMNbFYlra1pXezRY7n+j3yx8uFvPuP/4dh0aUetVr9ZPGgRLhS1fUbqjscsv83H4BC0vqKKIeRHNKNjX7aZr1hiS+4r5xJoxc1o5NZiPeHwexSB1+EREJfugXhQGsxcjPKG34eCL4vfwdrD/M5UhnlukjlBh6skrtzn+Okn+YUmLgjLStbxyemeF47WtrpKkpRG47+OhkExdBBqc2ZO4rjuoIeAB4iV+9C1E6gGs5UEM7VWtnsilv3DL0+99/P3WZ/cc3Tyzpl8/dzi1tbu47a/42FZ2z7tkhsMckG+fH6+2KUAi0gFY1jXhLWNWtb5U88P+IYPl1hYXwGKS//8K/QD8/u+gWgrboBfQ0NUmknGpad8ZetDiWT2hLjexIUgyoUlB5R4fKbc98jewjZPIaWHLuAC5WvkiEV5ja1QAhBZnKsXQFQ8m0f67XsKg8fregGz6ZwTi7PTQWvsz+61X/cH3zA//cKY9hvlmtlbj+6dWCxeKZZbH0u1vP0+T2qnxxWeOR4EMkRfdcRDQVp0nMFdxQUh5MhC4kgUnaLtQHwvygjsibqtaOWV+b1haUW/NzJWdOvw+qvabscztz3lBf0/5gM4mrhgLJtSOa5rZAc2DbxwrNbrUmbzrAdbuWYIdeAIN7MgReJ9r3UCXMnZ+h4KD6qoSVQnDBSqx5JiWnKSVeQO9sSJ5MAffHH0Q/fusz6SL1c31KMe2909cMCTr/6Walx/3PVb+CwjCDQaSMLfBsetYWgR5xF1FvwwzA9e9/SJiLxHnCsLskpIA0daSFjcVygTWvPReOUxrEiZ8ZX4dQck9fpvpdOdh+jyigOMiGXbsWq1mqqXV7RQLBtZp2cK3QdHgi0VJ66iAYSDfh0TznkPHZRkvuJwsZ2lSHUCspC7wjggpcRTccsj4wzU2GAma2PPj2ba/r8vTfzqPz9n/eF4vrx1uScDaJpuul7nTzOt7/+Kzy4tuX6OHjRGgZ4ThCLPQMZ0NQQ6B5uJFHDiImAkF+rnSBOxL5AdiuFQfBBWZAkKLHENhRgKUtxPp6quRHHojiQojwoxJ0gypm+dCfQ3fV+SN3yPrCr5JisHnKSWFZsqFAZmfPmNM4H69ppltYWXVySWbQ2mg0dHtt13IP0Ljx1iQ1hGVHTRQElEyQ9NwMybAE2MdCA+Qw3BB5G6Pgif54xCF8f0iYDTdI17vgqR1lX0Fw5Ob1L1YGCwxT+U0JXJ5XwzeCyWKHtBZsIwcu1O7fgm1y5okkSko4eVULjwZIBo4pH4IeTPaYtClM7gJEwlvhNeQTrh4CAqFwUST/dBHuHe/NUcMLlUpyeLSmQdqrLYu3/gK7f/WTbbsaLqqiBpvlzpLarxWx8YcX/7CztP/M6JQuWyrFc53t2a3btSF3RbFrKiFNtz4NT1X3ky8f6TxVjak0XrKjdXUHgRK1QC/iGIMHsRcUWsukA8GH9mZKQCl48eDXU1bmlpX8GrI+ihHctjNYtpu45Wh11NG1qXsw+nDPU0XvXB77XE4J6KFJ/0WdeYrmp9tnViQJJLmqQ4RE/8EcGw6CvKSnpuTNSBNaQUUApBZsgcllPIPnKheVxswqzg2cEvgNS4J+1qWGEySWQdqmXa3ndfLXjjJzu7NjxLV+qO0JImCuVKd1mN3XLfae93Pvv0+G/fc8q+dtxPJSouS2ztb5nuT8iPqIpihV9bUVgWstq2nSzI7W/4zPdK76qxDLee6ECn3CZ9oC1pwFxpzXfCTzrml8VRvRByVTwTPVKoxwI4jzKHlB6upaopzCXX0GQJ5YVj9lCgyMNDmdqRdFwbXa5VFcXYW+O0L/ec0lS1x7JHej1m6ZCjjGmERDA+XpqeXcEH3GQEpCW0qDzNuBfSivwJU8wLA9TbsUW+gKT0VVcionotzJO2VpIt771fS73jk+nM0CPiWeoLWNLpYmmgqCZfd/+I91t/+fTIh+8/ZV435ifjJTnFPCXDPEc22lTf7VOqe1rSiRU5ympZyDo+OT343Ij2jm896V5ts3DyCikHb6TgOhDlJw5ICUJNOcOyip1lB38y+mn8OtoyYVVxwBs9EcJrKu1j7qyHE9zCaMzyNGnvkel1shoMD+bsI5m4NrJchJVlxZPk1IlAWXdQ09IttdpMv+1ahkxOsayS5cQwT1hViouiEX/C9Q3JKm7DgX2Qla8oCRNKCUc1hrcno44qU1r9Ns9lV87Ixnt/aKTe9nEj1vcYERXSqhvQZlCuVjuLSuzWH40Gv/+px8d/98HT7hXTUiZRIz3EUFJZjVM8KsTwQmnLTlzZn5psj8uPyjIfR7misCxkPXZqfMePX5R/8emj+qAbxJnC3S7R0Q7F4KQkRBYUn8DsHj9fJ0SPwIOwONwQYYvnguHA45OpkoixqHdjvjum4vFlKQKNvXhkZsBhbHh9q3M4m1hOwsq+LCdHfGlol+t2BPS7vbbl6L5nabKMpxek5cngf8gXpDS0ozyN2MEuGo+IrDhBFMQCFT4jRfcygeOvM43Umw/rqff/g6Te+slMtndXPS0qus5K5XL22Mj4lQecxG987smRj9x7wrpmUm7RTK2FChYMx9R4oYNx1LLKU8cc20y0xxyzz7B3puKxyfB2KwZLTlaqK8hUgt3w5985+f6RcjrpSzGG93py/Y50gxMWOzgRnqLAFQVBfNQF3OVFAFEVrAPlEVlhMMTDcVcQ2ougUebjO1R/pfwn35DcTV9lvppm+48VBwLJGxruCA7kUrGTRKRlUWaQRlXjU0zpf1KPX7E7FutXXavS6rvVuCq7ClbP4A+N8bwYF8y71XBSJJxzE2mUMS5YpVN0jQ+UIKuk9Npq7MbReOYXf6qlfvHTeuzyv0ulW07Tl+sG13XVqUJx8CRL/PLXjjj/9R93jd857sWSpt7GKlKSmbybSeat27ypntJm8ezESiIeMyRTanNnTgx2tj4r8nblYMnJSq5I7HDevf3Pvz1+d83PkKQwjYtcJxIWz3coPS/aIRghnFkR8Z3Zo7qAPxVohQ9OUhxAmfkVOqQgo6uD6MwrgnARaZ8SiBiyovJxxUw22JHRUk9bq5K7pEt+Jq5rM8upDJqmW5qWOyipw48E6sZRTc3mbEdO+r6heIFOjnGMUoaJFfAIkB58i7wE8g7wlgOPpcgKZWnbFvjSoCXpl0+pqTufllLv+6yWuu0zutH9lKpqdWuYQQOSaVmJ46cnLn3BSX3w04+PfnhXPuix462sJsWZzQxKh5hggCJJ5b0OqAlQ0USFqxhyGTDXsuJXrW85PZhS71dkzOZfOVhysk5M5/t2jupv+9Yz3nUBCQ0jSzGoAGrPCzQuM3wI4XHQ7jLq8atj9jmwA5IioFWFyh3SaH4Z/J29TnvQdCSAlB5nYZUdchtrQUw5PuF0D3ap8YFcsEtX1dJyl96yrFYUtXOPpF36aKBsP6HHN/hu0EquQIcVKCnXlwyfAmkwbeUUVcFbXU/uNQN1Q4mpW2eYft0JW379Y55+99/Ec2/+rBFf/4CqxvKw4OFPLDtcsqalarVrWo696bun2H/6u12ld40HWcPUc6xGhZCHWT+UN1QiEVGFvLn+kez5hAc6QpUMs4Adn2m9aTXfr1aeyiTiK2qGkEQlUri7NHjuxYM3/sP+no999ofF1zFynVyPBEcVe9QVYIig37O6jr1Id0GE6NGicw0IvuA4BhKgj5PqhwYrsx2dlck//IXs396+SflkMh6rm9sIaxQEnuE4pYFa5fgVgXtyWyKWH/IdjHG2dC53KWZKWsek67cf8fzW/fHEwHOqmjmuKGrduzfw/LVaLXlqYnrrcan1fV/dPfm+g2WlvablmKMnuMtL5OONfyrJXqO84F4dFaIgK1c/jM7COGkF60oHzHBtdkNbcOSdudFPvP6yoc+j3s9/bAVgSckKYd73+O67/9v97X++85jWRxnP3/bGMN+SSjVOVlIIGCKOsPFQtAbjAj/ku40KqAVvFKW0YFie7HksoVjs8r7C6B+9N/cX16zT/jwWM6bD6HUF8os+yW0IVFILLnWymPTwkiu2szlSd7iep1aq1Y4ZOfHGr+03f+P+4+Z1RQeshMsuM4uS4sjk8KJSTk8NsiKgPo5F+qKEgKx4WwAaBG3XZ7rvsm6p5Pz7y7SvvL7f+O24sTLyBlhSN5jqq/Gi2vL6T39n8j2WlCFykvuLRgwuLDiHUAZ8IDa0GVtsZk/O4azDRgHeNxOQAuCF0AqvD1IdkPgwXbHSxyZm1iX9MXOwI7lH13U7/ErdAJccpJQkmcgZBcmjsGJIClDdNH5qbHLbATv17z77VOE/PjgabC5KKeYaFIigLska83XxFj3oFwp/zMGFxlHRyXxyfUVPhFAronPo6UlMo+/IvqO0aW6tk5VebM+lj+A3VwLwnEsGzF89dtobtj2xbg9Vfkg6+MmQebQh+RBAVOjDmTqBS2HMxgUKJrwkC61pSA39w38s+in28MHE0Df3tn7g6Zcm3rGa3mq3VECXTLVaa60G2pvumUl/4o8enfmdZ4tGh6VnGWZy2WT7y57EqhLJW6WCEa4bnRTt7qEm0YZrGrb8FIZKeszHetIEdK5aVKjun7bW7z01fv1KenvAkpJ1YirftfeEORxQHdXzVRIOgmhpnC8/gTOJumpA6ZVkzN1VSAZiDK2mo/AymBm0sB+8IO/4+vPGBw+cyt9m243/RrulAgY4TM7khw7W5F//k4fHP/XVfbXXF/Q2ydLTzCY1RquuRKxE/RRKjaWhUUCibzgacQbbyhuS5ukdt7z4oy/BY4ajbBNZj1dZu9u5bkfFsvBunhWBJSXrTLHa/cxLxc2eL1aFkDAmmARD1QRBzUhoK8vLWlTwtEJxSGM8xSMXzWU+ObyqQu4wkXjGybAvPypf840X1N8emS5e2Ygvx1pq1EwzcfjU6aufKMX/08cezv/nx/Op9WWtnVmYNwsdUnwqCF3er21QYRgnmaN7BrVvshGhBRWApvFlbmbPYQet9uIERmW5ZKVLLKbumwk2HRmdvJJfWAFYMrKS0mm5weHOvScq3aijQTqoE0FaEBhEMysvDi5GsXs2zozYWAD1iKgo3TFSBgObMOjftYi8VC0I9AQrSlnlCw9UX/P9vf6H8pXakGjoaYLkIFdrZm4y0N/8o+mW//GZp8ofOO5nUyUtxSqkFLxWRfFQH9VoX8VqHnSCt4agkIRni0CAPYBUXyZZ+i4aWRGiN6ugTmvJMfZSIRg8cHrmqpVSgC4ZWUvlSsvotDc0WVHivqzzpnE+EIJLNxTcGdwkMtPJVWdkkZ5QAbDSBF9BgdxhNFRCszDcD+/rmbRz8b/+sXLnwy/Jv1E1V47rVS+4rqtOF4p9RyzlV/7sieKffucIe02RZZlNJMJqiyAqhnZi/S6F5KmS7kCWLpcnyZeuaSR7BBSUZw9lFRlDJKXPsGGNu8QAWpMdSWdHin6n07Hu8qplr4j8WDKyTudLnYfG2EZHSpJAFlIwQVJ4HCHU1QFSBT4enFw07g+Ls2iRnB1XjA1GObEU2z+it/zNj827f/TY0V9u5Bc8XyzQd0pu71VPV/Tf+x+Pz/yXJ2b0TdMsxmxJDKYBIk0RbbwiCEsQ7s/bE7QMxU8fIK+IQaAdbk3nzvB46Iu1ZEM6XpIGT45P7xBX6oslI+vEdLH9haPukCPFSRCv/jMYbzrbtzpPaKsBElVY8WZ2mW9DRSBxeJiqhmk8qGuZpFQ4qcXZEwfZuh8faP/lXUem7zRNM8ZvskYA979aq7VMBfpbvz2e+rM/fWzmg/tqqbYClohB/QHdpmT3NPJXMTsYOsOtIAY0yJhEISgc6RJI6FGBiENOVJ4DCPiuCLNERxxxKQQarXT20rQ7cHAsf+VKqJosGVmLVbt917HqoCthzOlCfgbSCndXFSLlCZXjDKWgHVnhHfI4hUVAy36MfWunffk3ntV+69BI/lbLsgwRd3UD3TLFcqXruC2/71NPjH3sO0drN6ARqYrRbmjipfooFxJGhPlEUUnYQqiMqJriunBzoyEPfNFxHkK501XkAW8/oIC4EXAdx1HALbDg28my3yZ1DW6yXbfub2BYErLi5VPdG7Z2HBoPOjyyrBFZeWmG7VmByxYBiLYE0Wo370TDgVInBgRR2tFlNT8tSHm4DhKd9qlCD4WzJYWVpLj85UcrN3xxp/eRExOl61ZSX99SAA04VD8dOGgrv/bJJ0b/YGdZHS7FWlgVsiOyoQaBkYKiO4a+QKJDLYKLEMeRWPkWOoPXTPqCxMgCnA6BghMLx0UBx6I+i4vivhGZkT9FTzMOlYOhiUJpI49TRywJWSuVam487/eajqqgdJqtufMNpBCFuc0Z4OfOitewIBGT0qHeLmpQIShZGH6Ibh30vwZkOXzMq9M15qkxNmWnlK88at9430vSv8uXKgPht1YdXNdVx6dmhvdVjA9+5rHJ/7C3HO8pBinmkEeGgfV8rAIKbfzBzUXLHEYm4TQVcDLJji/mRgGaggIP1S5hKXEG36PPUPTYQOkRwlMiFi9IhVMMyyyuSfQcGjtSlAaOT5Uu56fqiCUha6FYbj0x6QxQTW1esoUw+D5tZsPZxxRWFXh65lKPgFIbCsZfQ0EFmZi0LqyASy6e7Xgs0FvYlNMW+/JD06/73kN7f2U1NjhhoMOp8cltu2rJ3/nfO/MfPGxmsjVMw3MN3i6nkjKgVRczY7AUEAwtWtC52hJJNSrp8C47lWSJs/QVhrcRYOwvzqDWibG/kDrkHuFsPZvbFVTHxAtODGK4L2vsaNHvVrJdW8nDWdbVKs/G0pC1VMkdm7D7MH8wKtFejp9xYfY0dqLQ4JinGHOpISWk8+i+4q4dzmBHIZfZSBBpFWaS0j5zQu5+cKT1nXuPz9zhum5dlWUxgddmHj89ftkuO/MfP/vkzAdOOMlYTcHypTGmUB0e1QLIA33ScIFFCDgheRcgbbFao0wBJBMnaDNPXX6W9iBOKHK+w+PwL4oLs9+hHbQKj1W9zOGSvbFmWa3hlbpgSchas9yWl0bsXgyMPiPlYeATtWn3FUMUlQM7sweNiTBd4S6HSCcpIa8eiEYRAZILmVffoy1F8skFqynd7J+fMy770UH9A9PF6uYwYkODiGocGRm76qla7iOffbL4S+Nyi1LT4PribQckG1ICPiGciAg3GF4IagjwQqAgfMYWGQKHtpgdjmNc4vHC+JAl3GioOCZRRDLmHky4DaNxTwfXebsCxeeNUogTxnNlVRqtSN2np4qb8JV6YdHJiibuvnUbMscnrA6+Tq0QyauDS2peWG14hfRxwoYBiC6Jw2hPJgtrsLKXU77xmHPj88fZvyJFz/AoDQoQ9dDJ01c/Y7X83t+9UHx3UW+Ra0qMOaQr0BSRcqEzkWyAl7mudA0FXhQA8d0w8Ljzrp393TBEmLse3nP2OvYVdrLo9IzOlLbxKHXCopPVDwIlb3mZkYkSKRXdfp6Qmjh/cDdPVtihMa/1bx+q3PXEntNvdRvUHQ6Jes3TVuvvfXFX8e6CkmVlLLwGy0jXRSDbRjrD6/O05STl364j6AFGCmZboq17PRmjurXMLzpZsZByseK1l03fiEq1Ji4CVFnzyTV05Ay7Z4+z7aGjxq+MTxcvCa82DFBHxaikZ5223/3i7vI78morufgJ5qsqL89nSUnbyOJhU38NEo1TM5afOlG2B0zbzorzy49FJ2u1ZqanS1KHTK7NPF+iiQsE2jQlpjKbxVjeT0v/tLN2zbcfeukXG2n+K/pRT41Pbd/ttPzW3z1XuDtvtLMZSk8ZxERXakRUAq+P0hEK+tAhDa/UCXhGegpT0tVTNbl7ulQZDK8sO5aArHZyqiS1BkRWPsywydWLAn+1hYSpYBrztRTbO6G17a0M3n5ysnxtGGVFA20Y+VKpb0TJve+ruwp3F+Q0kVTlg/HRKITFYjC7F8vfgJZRw85KKeNhV9HY58kxdrqmtY1Ol1cPWWs1KzleDFr48ptgap0LxkaH5wX83bAgredKzFZy7N59xvZD04l32LazohubQNRytdo+whLv/oddpV+alNKaqcaZSzqBid4xJWAqhg6iQ4bqqFHra9RiuwLsKj0BSg3MwtHYSFVuGy/Z6+iZ6lKULDpZy1UzNVbw220fI3YW/fZrDnzqFp9KhwNSaynGDk2ruS8/UnjDs/tP3bGSJ6vXTDM36urv/qtnKx/aU4715LEIAdVRseIKRh8FrkcuMCY5EDXJF44YENWeBFHrwotZgKxYPcuhqshITW4xetcNBli5vQ5YdDZVamb89AxVwlW4wSTo+sp6VQBEJSslZCnjxVcG+/Fuc9vTY7GfL1Zq/SLWyoJpWakxT7vrC8+WPvjUtLauKKfIjY/zwQ0YIaST/4sJb+iw4eUQD4KwvBsFaaaDleAOQ49dSWVTVpCcrno9tuPUZVD/opM1COTEWNHP8dfko1LSxEWBW1QCH2XHVRluosLyblr9lyfd63+y89i70CXCL6wQEFFjz+47fPvXX6z+5hPT2raKkmAWBjjgIiUBqUCyQFUPNVbyGARh0V0jZj9DMUPO1pWw4hnw0ERYWZKJsG2Faq1bXF1eLCpZUUfZuOmSxOm8lcZqhnDbmrg4QITR2BK4jlg0HGruSkn2xBF58JnJ1reMTBYu5ZFXADDe99CJ0et2K4O/8d1j9vXTEl6uHA68D4kKoIoEa+XKGrn26L5BuzfG+RJ9+dzfObe4voDwxZOAuOPVoG18pryOn1hmLDabJNvzY5MlL4HSf17Fo4kLBMgaUMC4WLScwkXkbjEVhuh7/eHz1Su+/+hLP1ermYnwK3UD6s+jk1NbDrLWX/v63pk3VYwcsxQs6C6em0/rCF0FUBENSR4P2OdXOUlBWoQVoTxc3ngq8TTjVbttulJrfLJSZqlVN4hXbKbNddusAIE3MLgdDWeOYDQTxrnKcB1J01F3PThhtO4qD772yOnCTfBs+JfqAPpteaZYHDgupX/1C89N/XxBzUhVes6IqHyCIBGVW8xQJSICIHWwpdwtJtLytg7C3JhdflgfRBINnyVfczO57v4upFdcWD4s6g+6rqdXLJbAbBvesV1PIa8S8H4+tAhjtQQSqO9A4cmt5EqNdYLS7N7d3o4XZxLvtBynbqNrytVa6whLvOcLz+R/ZUJpMSoSVqShJyUdgJJxy0rPz98twwP2+VcFaYkJsLDQHaE/BPpSZInrCf4EeF56qpLlJk+bbodXh+lyi0pWx3V102ZxSaY6CFwHygDUU5q4SJAMQVEIlC8R49EpmSyRAkuUZCOFZOrbT1Zv3nVo/LX1sK6mZSUnmHHn3z5b+vXdpVh7RU2T667zVQc1/uz80Tng7GIdJSVw+btn+JvkCWh8cikOAsYK84nm+CY3q/UlLHQYz41GPtML9ILtZV3PW/YRZItsWV295kgJwVCUisJ9a+JiQPLj1oV8FcotlWs/KTO0m1xhP1CYLaXYAy+al+zNx++qWfayzrlEy+8LLx279dv7a7/+1JQy7MaonorB+fTIqkqWMnzHOwqbaCihcHNR8PByiCvhrCIiebSZK5zE6XoiekZMobN9RSnYLFu17By/uIxYVLI6rqdV7SDGC0vu41BNZAWUjI2MaLE1yNCTfOZClsg12qDBCUrtKhobN1PxHz7t3/DcgfE3+MtUn0KX0YHjIzc8q/R96JtHareUJIN5Mn/9FrdC4lnpIcMkwG1Hw6MvqXzL3XvEpWh8Liq2FD2qqyKhnLTRDeoA2B3+65C1j+dPsJKjp4pVs51HWEYsaqZ6nq/YbqBzS0CBylJSNoQwQhMXgND15aRF/RUhvBIpNZ3Ai6off8nefHgmcZdpWm08whICLb8nxiZ27PLbPvj1vYU3lUmJZSNB2U71ao+3WAgHK3zWCKFWzAYginZGmNUZHNUPXJXxpCh9UJ8mT6ZgSdmZcq0zjLJsWFSy+r6vui7TeLWJF+4I9RX2aoBQapIlpqhwpsJa0VnoDx1B7eF2TlYD/cfPF6984eDYktddC+VK9ym97T3f2Fd8S8mL0dNoZHnouYioCplG3jfMn2xRVawOAFUhdkoLBbwAq2j6yUJl6QvEs7GokoRldbyolUyoUROLhFlLA6KiwopWJtrQeQnuGVPJHU6wRw85m14qJe4w7aWrU6FBKa8k3/TlF2u/dNrLxJjRwl1bz/f4u3w0rPFLz4V5uI2vAZQCkRxInoLEyraftNyghV9eRiwqWQNy6j34CWRV0b2A3rVF/om1h1mShoDi4LX6Msp4WDKysGRWFUVlNtUZR2rx2E/2+Fe9eGTq1qWwrq7rqvuPnrr+2y+Z/+q5KWWgIqdZ1cPYWbI8CuU7uYvoC8Yb3WSytHxt7rPT0EiABCltICpfqE2SWcUJEt2D60HWRZfvq2FRmeT7pEZEVj4HE0DieEYta5pWHSJlx2aWfpLPSQtRo2D0uXU1mC1n2QP7vM0vlZJvXOxV5EH+qUJx3Ui85z3fOVC+xZQTDC/Vwigkn1iJgQ3kWYmWYKrfKXi48NkbGUhCZFXRSFZxWWzG8bLLvfj6opKVMlOm0oeyT2gUpnc1cXEAUdGgygs+Eifqr7z+xLf0SfVDiBmr1QfkCntKko0U9eRPd9WuPXBk7EZxl8VB1TQzk1r6ri/vK72rqKZkLEeEuWJwfQE8E2an4jUgeFa08OJ1Po1sWXkDE31w2VPwqTJe9QLdcrwkkhdGWxYsLlmjD0pUE4sDiBKZxEWKD14Agh20JRbAGYZ7xq9zl5j2tAR77IC1+cFnT7x2sWbkuOT+7jty4vpv7S/90sGK1uFpcb5cKOqlKChgevB+VEXDQA3uBTN0s/PnamSEJQ0++aR4kr9F3qPpBnHP85Z1ttOikpUsaSDLUsAHnYfnmrg4QI683xE7POAD9gxTEEU/JEp8nEZLAXeJPZkdnZZyp+Wh60anihf9ukK4v9PF0uDpTN877z1eu86Wk8zFSiD0XBgFiTV9efHhEHFdWB86oMAfdTUgTAcIi2aAgCmySa6w4y7vKKZFJatMZFUUWaxd3cRFA4V65EK+XKQ4I85yohJbePxwlWxbSrCf7vW3PLbr9OsvdjUJy7YTJS31+m/uLf+cpWRlvmQP/2n6QfotPhSPtjjFeRo+s6jnNTYiKUc6jaSh7mp7zHBct3HJSpbVV2Ter8BLe5G0Ji4OYCDkGIbZXcq6cKASr0vROZCEz25BBCXBdo9Kvaf97usrNauLR7wAwKoeHRm77J4jtfccyPtdJplN8p6YolI9jirTGKEWDVJCHRqD9PH+VDwLxvlyAxwqeqMiKoB4NhBrOVkpmWRZl/X9uYtKVlmRPXKLXLwunisUPmYVrYnzBSchyQ+vLxRd8yEikcLfJOXh8UjksGK8UY+uuRgzzFLs+ePB0P6j49fgaxeCas3M1HJdN99zqHiTp6boN2DCw9+kn/fwq/SM+MNz4se5YmOPrqOeN+/JGw9oXKLAE4G0hOmherrier7O4ywTFpWsiixjPSyqtcC4hv2AjZ1VdQesFScrCr15mg8ycEtKAW4oCAPyYNw8bKuLlRA9nT1/zFv3zP7xa90LWMUf7vPBU6evvPe4/7YxJ560yZtWVYMKAm5ZGJ80jsdCTtMDiQnkouYMhI/a4KBUkPGBLoOzIlEkXyq1vNkBQMuDRSWrLMuuhvWoRV4RZlPXxAVCWDAq3SOZQpzYpy3cT/SVoUlW4gcgjkQejk4Fp0bWVmFHJ4LWGW3oyulidT3//nkgXyx15bO9d/74aO1GW08zh6y1jzqqSsqKVmB6qEBT5lxdHNPvg8R4TCgXbwKb1YfGAx6dpwPy5mcIlE7PDzTXbeDWYFWVXV2XLNRpeOp4aYRtExcMEiWIADHCuHIWUJi1qmTa5MAlQhChQRqSPTru+cBzCjYV/k8fcjc9u2/kFn6/BcJxXG3vkZM3/HB/9e68q2qOrLNA0ciqojjArYmQUFrax4LdeCzMmMHWpmOPHlChuAgrYQL5hQJp5YUNfWALsSI/qIxUHY9cl2XEIpNVdWKqVOMppA8kCoi2TZw/RBurqCcC2HD7ReTEGdRRzxgpBHeYzB65aDwylKtQLKUnpmbOa0rXdKGwvtC6/q4nRqqbsISoQ4SDq4uZJ45DT0T7eNlxQP6gcHsj53f+o9Bew2c+nh+uvQDShkCWVfZ8r3HdYE1V7JQR1AKXSnrKKJmvWtfExQATnhlGtdFWyBLkwFtJiZCkQXiHKSycj5EJRB60xqoKucW0RatTQrPcWzZJz7zmqg0/4l9fABzHibmxzM3feKlyV0XPkBUhZeVmRTwD+la5W0js1TCskLb4Ay+hUJiXivHBvA5L3xPFSmMCzw+Jc88GxwhU5SAPQ/Yx838ZsahkJctqxzSpKlNOIuPok842bkatCEBJuIbQdlaUvCbI67IOkdIlMskqVZ9Io9ASDxcYM19U32SXD8gj29pLP1rX1/VC+OVXBbpqTo5NbrnvlPX2g2Wlx5Zj/Lf4M8wDHoUH/nxnXo8eE99rZKIC3DmAMp+VDlQ6SFaNS1ZNVa2EwSoqOvtIaZDQsxPZxPkDYhRqj6HyqBhCwKJHFX4uf2k1Ko8+kZj2bc9lflBj7fGqc9tmZ+drrhr6Pr/RAmDZdtJMt9/0gwPl210/wX9rTechJZ0bnkgEkU7PlZzLhkUlKwZFJBTZzMRkM0yVcJ+auGDMKgl3xsSCRtw1o/O8DolKKeWiTy4vFgHnS5WSxdWkCrtmvXP8svbij7raWw7xL54DsKrHRie2P3DCe9tJK9GCN6f5Z2jqGgRXYyoWzxIBid2XwwFAy4XFJitzrJrZllIqeOEQ0ilWqVvDmb1IgLKI5TtFIchFSoH3cxJrsaYw3FG4bIqisKxhOq8ZNnfedPngD8QXzo2aaabtbNdNPzxi3VzT08zE/eiH1zJXXwnICy4WMk7hqWXBopKVEBw9cqja06IVeHdCpFhNXBxAFmKMWDxtHnnCLZQHr1CU0cBEIfCq7MpB6ej29to9rbnMSRHr1QGrenx0fMfDx8y3jNtS2uTeNlzsMMIaBdpd+Ig8YWJngWG1iiyjpW/ZsOhZkYgbte6cVsBAJt7o0OTrxYPISLQhUWoUkGUk1HmEhSphbAQmpKuBxVpV07l9s/T0dZcO/pjHWQBgVd3WnuvvP1m+wSPL7EvkGSliNcWmZZ1DZH+oJu+qimKJo+XBopM1GTeqXRkpr0oYyLSsXsKqBCgqynd8ohX4lbMMhT/krboldv16dmxrrvST1ux5WNXTk9sfPOndOWrpSYfcalXFb6GhSgxgXLNAQRUWiOEuB1lWIqtsh4fLgkUnayoZK/W1ShOKbwv3oVkqXyQCXp2AdUOD0pyVIwLRPw55dYOvd+SxNsNyb91gPXv9jr57RLxzw7KsJGvtvuaeI5XrbS1NbrVKptoVc1Ux+mENI2og5f3YBAnrX3kOusZcVVUb27KmErFSV5pNYIiwAj94DRfKiw0uSnyAsSFrwVNeZ8VYP7fCLh2QT21M53/a3pI9xiMsACOT05ufHHXfMGZrGdPHK45VUkiy6Vh5Av22azkTIWD6j8YwoTqCP01mjq4qJj+5TFh0sibisVJnJphQA1vcfA3n8+JAtPJCjhFHUQby9gAuXIxWopKeqh0Z1fRu32a8cNOVQ/fh6kKA0UpBruvyB47WbnQkg+5IvyfLTJY0JnsKX+Z0njlfc4jqqLwvG3KnPzTiaXJga5pSE1eXB4tO1njMKLcl5YmEiklay9oNtYoBhmKDYRB8KMQZhEX/qxpU2JaeYOKmTeojXe25fbiyEIyMT65/ZsJ97aFy0OHLKr+34Cb9UkBkxVBDHK5hcILOkwLtBTGFWZqqNrZlVRTFaYnJ+c6sVsK6sWs9oxcP85QlJCof5oc/2Wd6UApu2SK92JN176conMbngut56uHRyR0/OWreajLM9pJ5vy3mAKCYRZ8tf23OGrasSDkmTXCEcteo4hpT5aqmKFVxYXmw6GSlCnnge05xfXd6krtoC9ObJl4FsxIk0mBQBF6ZyNc8wgUQiQrFrmxQvnI9e3awu/VZEfncyBeK3UHP8E37JmqDnmpQXZXuhZvKdG/acp6uba5ycMLCg+Hyxugw2TNUpSY3ej8rMD42UhzqTY/Bt29iEUDaMidJ4faKccIAbKvPrrskc2gwaT8Mz4afPgfQXXNibHLL48fLr3FllbxdDGGke5P+KZJFBPX4sGDeAh1+Z+0CHobYQ4cWWVVbc+1Ko49g4mjJpqeGOvUTYuhkWCLxLEfaaIvdeUG8Gc0PA042MQfIRsiEb+CaQnmIRCCSJLksZVjuZX32ni1DnY/yiAsABkHI3YOXPzNqb/fVBF+qBfflN0Z+UGHAf27NZweICtnwXfr3WVr1ayNHDuZXBVmz6eTMunb5JNZmF0O1kP9QBeEWU5pDxRO6wYF087RDUfiGx1nzQxZJCKKhTsgtIIb6vko5p5Ls0LdaYZcPeKf69cnHM6nkOP/OAnBidHz4qVF226SXitsBWoGj2TXottFIMVSRZ1xB1zLIc+EFGAUZK1+4rF1n1ZZkLB9GWDYsCVlTyUS+Kyed0mSH2IcRMHNEFOEsRMydBygIPz1vuyaBwg6kIRmg8QdKg3cJUTWVTnhMC6rB9cPqget39D/M4y8AeNvfyFRheOdI7Zoq+bp45cVc1kDyQi3ErNm1LPwQXBmhxejY8siyBtVMwlgdZNU01YwHtcm2NKtoMpEV9R/8cdZFpBXgyhBZT5RgFNY0Oc8GZAGyzsspsdKeGLHUajj2pnbrYG9Hbm94+ZyoVCstyXWXbD+Rr3VJsjLn3RCE7JEPIPC8C2sYXC2x5Z8+S8WkSiYZm+EXlxFLQla0CJ86cWRmS198ROUNZqiLimuz9VP88qwukBDOanrkwpn9jtiuTSDxFPBP3m8gg6ogqs8Mqq9u71VGc/bknvMZVD46MTX44rh5Zc2TZUnD5ACC+AmBeQJf6wUnTz4+QpFg2Zy0HpSzydikOLN8WBKyAh2t2cnL1sWOKX6VyAs3mGwoJVg0IqEORoFrAlw8US8Qf/wUhyC22F+rwNhUBP5WcX5CCAcDarTAJBfYeOm6HYMLbljCWsCnJvPDT54sX2VSPRVF6ayMw/wQwMkorGGQOOYkghUbHZC1lE6sIrK2t6YntvbLh2WPyMp1AD8VBsr/M13ikKyRVDj4l+aFNYqwjhpQhTXgg8lJeFjKhVmsLVYzt3S7+7o7ci+KyOdGoVTqVNZtvfpgifV6WoxyICQjCR/yn09NfryGRc8BXaUNamqowxtS4LboUiGua0URYfmwZGTNZdOT6zqkwwnFRvslnaGfCsK3n/GWR2gCLK5QEhTv4eGcwnArHFqUNQrRbYCVIKA18DRoS/9yYLKrhrRjHUrxqfNygacKG54a9a6vKQnJUzXm031hWUVrfVR4zm3WOoS4SRgkH0xMSeiBnTGkGV1VK2GUZcOSkTVmGOW4Yp/sb5HzCl7iyTOfUs4HhsO6opwicB8MlkJgtiSnHdTO1rzW8NZgsn98KQhkF+ThMV2qBldtkA5durn7SR5vAbAdJ2Z09m1+atTcVpNjzKZ84J1CkfCb+JngRSblQ0ZlVcW3ppZ79BKwZGRFI1Nt7OT41cO5Y+ibwmJe3EhCO8KJmdz1DRWFW9RZoiLMP7GGgW4aDDB0ISu8wY0yjer8HWm3srHD3tfRkn4pjHlOnB6fXLdr3LnttKW0eopB2SA6Z4CXSbpJYA6UldBVFVUP36eqh1K0x0ZPL/eACGDJyAp0d7SOXjGU3KdJDiWW3Aj8WvSLJAAoCuoCL0OTo7OA1SNOcbmh3sr7WpnNtvepI9mgsJtKeBR/5wQalo6PTW599Fjx5rKnKQ5ZVbxIl86LCPQ7+K0mzkTkBqOBT6FiszOpTPW0Zk6El5cVS0rW9rbs2JZ+bb8WVALJs9HdijHiISCFMJyNM069wvW1BJIXL9AQiKmy7zCdVdhlg/rRHZv6nuZxFoBiudyh9A5f8+KkNejJajhUUVhrwVKo5JylhVOD02udwEg+l4rvMoVk35mQpzpbMkfF1eXFkpI1lUzO5OLWYcwIkf0aKZp4yS73bhG4MojumdAzFtIBuKas8QWmCTz1kBVBUjAo0GRthmtvbHGPdLamD4gr58bo+NTArnHvmoqc1JmCRj66LQldJXdH/IbwdGblvbbFPgvh1JBkqMRUqdKaS0gz6WR8TFxdXiwpWeHXVydOnbxxe2Z/TLWYyhz0OoR6EDI2JOt8PRHAQUTWMy6sKcxKgXZkBasXmmx7tzya9Cd3L3QNIN/35cliZeD5MWurrSTIQKP+BQX0RcE5DyIv0Lgn8uWsy2sO8GrQtoI8yBhKJRm4pwxNK4iry4slJSvQ19126tpLkrs1Cf2tpFtkXbkCQEuivhquGmcrBjQFYckfcUWDiwd9rJCb7/H311w2oB2/bFPPMyLGuWFaViqzfsvwoSLrtchbQd0X82FVKgHEOktC9mfKPzwXZsPaBdqRyCMkIXUm9Wl7YuTYQtsJFhtLzoT21uzpbX3S3phmegxk5SOXaCO0kAJtsc/DyxWG4xVPrhFQ2lF14JPNSXYJzfMHsuaJ3o7MgscCT83ke44W3G3lQFU9CUu3oHZKVhX5gPuG8p0TM/bmjtY64AJD/j1pZaq/Y+EL0S02lpys8Vis1KNbh4Y7ldOyWNuSlASKR4EXWoKhkXqIUrypKPOBhiBZEQt19eakQlA4fDiZWPhA8qlSte/FCXM7zAGqISgUMXLJg+xlqpHRJjy96hHpGA/h/hwiLZwDb3Qj+eu+HQzEndN9rQvvKltsLDlZ0d9aKUyevG1H+4t87g0Ii7oSXqLENCa5WL0PC3MRfbnGkLAEi8P9swW6xkAywOAQiAKDS7b06Kcv29yz4AXRPN9Xtb7B3l0T5gZ0nUm+TR8ka0VhLskV73gNy8t5ZMUe1WvxiSzAxQaFSIkwDgB0KdSu2XRH+hXFmx88khne7J6UbGddzD3dkkqeErGXH0tOVqC3u/3EtZuTz5F6BK6DIYQkBlk0HmGK1pnK0MCasRQgcQTkgqGAw/uDNvRopzYOduwJr54T5Uo1N2Wx4WlXzeJmUECQFf21kDRXVJyijRhyiLMh5u02MhZW2ESRsBX7/JMEA4+mPSaV2iX3eD2GGUZYFrLmspmxnoy5ZyDnllSf0grLSf6YTwoYBKKuHpXgKM9nhbumTaoA7Cq6t7ASfEx1/e60NdLRmj4YXj4nJmfy3Ufy/labTKkvYe6qcOsAfEZuMX6JWxMUDKsU0Kuo65CnPdzO6ps4G0mCHyMOPJqetDpRK0wersfIpQjLQlZFlj0vP3b4DZcndsXkCv0oOcQQEOQxTzm4EMPDSKAkNbFdo8DLkfEmc5k5rCcrFdypo8cMXS+Hl8+JYtXsOjBhb3KYQi4vBkOEWR7KVTReif0zrGp41Ojl5fw0zLq7tOW7s2kT6eZxebrnJIHCS/Ec1p9WRtb3LNyjWQosC1mBwb6OY7dv1Z+KsUKAidNcUCQ1vtI5dqNAUoqIOkveSHJrFNyyMptt6lbGtm3sXPBACN/3le6B9d0Hp2vrHKZREamSKMlyhPKclTnUcxVb1IiAEYReiTSfmW6KR9FwJiI2xrUnJMvvS0uj7blUXUYuRVg2sra1ZEeGctZz/Vm3xAK8fIuLBGaX7+FDBodxMCdXcbzmgYW6bDbczU4P97csmKw100yNmN7gZNXPukRUl6yqj9ZfujZrXUKZR/aEt9SvepkjrWH654ETldIeERafakAeTTzI92ruoZiuL/u6S/OxbGRVFMV1y+OHX3dZ627Zt4Q0fFKPs2oAZ5dsTYA8PtNlJ1jfFox1taUPhxfOiUKp3DZa8tZbTFU8qq/6PLtJ5iRgiBdHXClXOTvnp45bU8iUpMFHcIVX8cnDPL1DXI0s68aceopVZnbXs74KLBtZgcH+7sOv2ZF70pBsxtcUpuKdr4AAgoYBOIOo8/fXIKBAsHZpw7e69NpYImZMiSvnxnS+2Hm84Gz0JJ3qqyCruN8Z8j3DDcQh5Qm/HlqfMy83LKJkQJazbzOYlzjeQxHu83RTwMARLbCCdWnpxPru1t38Yh2xrGRtbcmO9uVquzoSTg1v6A58rHworkFBEGb7vqJzuBjGWbMgC9CVUcvTY8cn0W8dnj0nao6bO1GwujHLRshTrAURgVtY+MMhBD1XM+ZEN0fNKN30KTacFCC07HssJdn2QNI/1ZpO1mVa3HwsK1nRKuzOnD7y+ksze7SgQsfkhsyN7A/FhwNRuvN1msJraxVQIChWb07OD3RnR8LT5wQal9o2bMyNVf12Psl8nhy5hOeJFnIXlgXxorNiUESjY366Bc4skoTOzaWWqyOdVOiKxlzWnVQLnRo7pqnqsr6E6pWwrGQFhga6Dr3xCuPRhJf3VYymQe88QZAzChAcAvYjca5FQLFAIZv1t2sT63paj4QXzgks4VJ2gs6JapDBHSJwyUKkQrwcuC5qb3MhwrxoqwpCq5BWoWOc1HSAARBy4PFWYDQubczpJ2Wz9Hy966vAspO1va3l1KZ2e+dwu59X/RoJaN4EBq4ZJDEuudWqJucJkg8mnPfk2HRnW+p4ePacwMil8WqwvuAocRAR0oz6U/Hx8jKQFHfVixwJDAlK2/kFFIBqAXd/iagKGZIYc/z1OeXIuu7253mEOmPZyQpXWKnm97/t+o6dmo85riQqrjhChAA/5mHVa885QEJACS87QXeLNJNNJ0bDC+dEoVxpPV2R+j1VJ4EKsvJAt5yTtwAX9bwAzKnxXLzVhTB1op5BDh5ZV/LycBYvFMGqEB1xKd8V8/dmkokFVz+WEstOVmCwv/PgNeuDn7bEmS37LilPpBBRe2WoVHxvbQPlfzouO1nVLZxPvalQquZOlVhvIGtnEDQiYCRbnBZVD3E8B4rD+9VE/EaFSPeZQIqw/hQKMZ5+cVq0D3DL6vEhJBvbYsdTZuEZGWM9VwDqQtZ0KjUTd8aees2lLftQgkU1Ji7ZcMOFzLcv06I1A8gEQzN7WrT8zNhxlO6QyoLgeH7mVMnsRJcNlFMQFF+fKxABTlTa4ixviQ/DagWXQpg+pBv7XCLEVCIlyZssKxHWkAN/U5t8eLi3bcGT/JcadSErMLy++6W3XK0+mFErngbChtYVC0NErcB4uFcqGdcKQC6V2awvG+T7u9ILnpoVBIE8uHE4e7rstPGXbJ5BPhyccYLj7DORIkf7jYwobbxAwtHs6iNzXgPOgKgoHgMq4DpiLL9ONffkkom6TYk7G3Uja2d764nLeqyHt3da4wnfZKoo3vgTBQqJVMLSj3RI59cqYeECa8xkAy1+vrc9veD6quO6+owXtBQsPymUEyqJAHWM9oUK84H82Ib7OCvkjbgi/py6Nx4gQ7xMCknC3F34s9gX0vConoozpGsKEdVDvZU8kUBhW9pix3JO6SlZxmsQVwbqRlasY6O55T3vek3bg6pXJmI6WESC5EbCo6eCRfBcEnTdnnAlgBQqsFlr0iu0ZuOnw5PnhGlaqaIVdJo+04WlmE+2lxOPOzJnEDUCPyN2GxQiBaJ4QtJgDyKPAUTGWggKrkLtFFz0WUr1vS2tyoGNvR07RcyVgbpSYaC34+CVQ85Pu1tYVfZt5jokMawR5GP1CExS93k9au0CSuaxXEoqZ87jFYOmZSVKZtBC36bK6poWIERIMhTzUrmyzyOrTDvw6GTP54YB3jHeErcu4Y4PJ72n08nEggvI5UBdyarrupn08k/ffUvmYTUokuDQGY2HQikYMLyN36PSb60OjIBOkSyClhgrJ2LGgtdcqlRrmema24mB+2tTcnNAkxF/TQvfixReSIWfp12hc2RdaWtIVnBpe3AgHVTxGs0VJb66khUYGuzef8sltXu7MzUzIZPwyLpiyBeXIllWvDw4KgnXHEh7YprktcaViqoqZnj2nKiaVjJfc1uxKkS0fMtaBdIu6t2oUtAeb8iMgkRElZhGCqdggSryhdt0pzacNPf0d7S8QBFWFOpO1lQyUcgFM4+95Zr0UzLVXSFW1yGhYo0mGSvHr1WmipRn4oolM+e81v2pmWZipubm+BIu4bm1ioiWAKoUaFRC/TUC6vOYaSRTqaZ5DrskJx3PmjOPxXS9FEZZMag7WYHh9X1737Bd+WFHsmYaik2lH1royMpiCRLRlyMirjkELJfUzNETR/Di3gXzrmbacbKsGdT/qdSjM2u3wIPqoBUYAEmjII6IukRWDxbXd1lOdr2rOo09O4b6HxbfWFlYEWTNZtJTbfLkQ3dcpT2rBDNM08giYGI6OLtgFV2NCFgmoVRbMonzWqEgUBSjaHkp2BD8r2WgRzBabjWqo2ILEuMcv0Ys0AKHbUh6Y5ekvCeyqWTdFvJ+NawIsgKbN/TvueuK4HttsbwZeDXRiBn2sa7R9iVe9qfjci2bii34lfgYENF/yZZYyXRjsBjczYMs1yCgNpyUpOW8v5nUXSZPLSKtTx8gMy4lJMe/ukN6sUWxHzifOcPLiRVDVljXTjn/4DtvyD2tyya5JWJQBLq+1jKShmymEsaC608+kVUOmG4FsnZm/+raBKwnAkgLB5gzkwcBsFLyXNYb94rbst7TfW25FdewFGHFkBXYvGFgz5svU7/bZuRreAcpunLmLSaxBhEQWRUzGV84WT3PU2sBS9iBpHKrGp5fqzhTd+iIDzWEXITqq8xjMd9kO1qll1r9yk8X+ma+emBFkTWdTk13KsUHfvm21kcTwTQL7DLTxKtE1ySgaHFdsuKGtuDZNkRWzfFY3MWCiGu4mAOQeji0GBARQVhYAVBWC2zWabi1rVnv2Y19HY+Fl1YkVhRZgc1DA7vv2u5/a31LpWToLokTtYq1ah/In1UlR9fUBfexep6vOn4Q8zCKrgmu4GLQg9Ci+e/2Qb8r8ZRd2cYO9EmlH8VjsbouNXourDiyxuOxcptSefiXbmv7iSZXApdclDXbwkTQVeZq2sIHRHi+p9puYGBY9Ro3rBwYBIEpb3xWF+lRtIQLAs5lZc/ekjKf29Lf9VD4lRWLFUdWYP1A777XbtO/t7GbTeoq+m94m92ahEqVKlWRnfDwnPD9QHYDDHlduwXcfICQSuATT8VYc5AVlhXA+c0txqm22vTj6WRiQpxduViRZDUMvdahW/d/4Gbl6x3ahKkwi4wEBE7E5UIXbgzGD4PIfLFmlJz83GoCKZrMPEWRFjxNyw98mayqjvlK0Mm5VTgaE3CqohABu2eH+eDnQh2hb/JPHGMABLpwUIfVfI+lmeVekjB37Vjf/VMeaYVjRZIVGOjrPnRtT+krv3idvtMIykwmfcX7XhgjvcVT8xoZmlA8JkGXw1ITecMzC5cbDtGTz6WAyOqfz5xK3/MVN8DUJRIQCjG6TyMTFlTDoEmRDnEOm6hLZq5b5szAWzpwnY6w70kycwJMi5CYRnKJu1V2SdoZ7XVP/6S3s33Bb5GvJ1YsWYEtw+uef9sV8W8MtdSKGgirSExRNZI8XaQciUbSRRkU7dApHlYDyD56FM7DsgYyGpfQ4S8QbVcZ5uf1/DynD3Qv830c0oHE3yItzvOlRn2f5VTHvSJrPn3dpv4fhlFXPFY0WROJeKk/Y937wTe3fTsj5x0/cJgbrkDHh6jDKyYT62MMLJ3hcxbJisy3JHN7jQl0lZ7PiBqMYCJdnDeCP1LbxgS3njzHIQhxDhsoLg+UzvAqD8h/EcQ1fN+FPnCLinoq6rAW25gJTg54k/f0dLQt+EVf9caKJiuwrr97/xu3s3987Vb1oOaRdQ1s4eF5VGIi25AbYTKwhyBAObN2MSeGVQDu5p6VIhwi11EwC3JSCcUDCmtcF+TFW+NdqAJ9QSXa657LWlXbuTznPHnt5nXfx70aBSuerFj+JaN6O3/heuMbfRmzqkom811H5Bb8GuxEvJzN0ahvtvEJy3UPerdgcCscJvw8vrZCESVmfhC5DsHAhZi1uzwIOyyIywUnfF/6Ihaf85hBBf5lLf7hjXL+Bx2tubq+b/V8seLJCrS15k4P5yrf+dXb0g+k/AlPZejJCBi5ezz3eElKRI2a5TGPM1JU8dm4gNcP1zY8PCeofovIqNWHgAQaVwqcfshTcRimhguFb8U5bPnZ2SMxLpoCCQPq4JNFVTyLdau12rU565GrhwcayqoCC1aCeuOSjYPP332l+sVbh6WTaclikudxdxg5gxUQAb6qBEKYUYLEyFhxvRFBZKU6aLDg0Uh4J4tM5oZbFK68qwciRWcTFSogiEqiooSHgY75Qt60RXysrZRgFf+mPm3PsG5+J5NKjvMbNBAahqyaqtqdcf/B99+U+HK7PlU1ZPFSK76YBEB5x0nKMwgHlDiytmhkaGRg8pHv+1p4eE5g9XhFYg7V3ajcEgXWqgCyFRtKz8uIygkqzfajzpGXrlNBjlUgUrITbEq7p2/slr+9baj/Xn6DBkPDkBXoaG8duaS99i//z+uy96elGVcm60q5Q/zE8AjkImUfUoS6jESBpy7M5QaF6wWK6y2crIoie5rCLAULL3Ntbez0z2KWpAhiH4SMLGhAJRQakviqEJTvkessEVE132XdmlO9o1/7/rac8deGrpf5TRoMDUVW4JLhdc/ffV3sC7du8g8nggrljkf6SG6OThc9Yq5DQaWSlpjqomtH5G3DwvGY6roeUrcgKLLiarJkQ3+ht41OVSgo74ahbWRVBWnFJxJJfGQuZTsmmSPBOEYhjpZhg8qsDDO91/Tqz2xPuF/LpdMr4iVTF4KGI6tK7nBHwn/4V281/mFdplCKyVUmyQ5zHZdbWN62BNKiXhNmXuNCYrbNNNvxYuGJc4Isq2uozJRJCHy84WoB0gK2hgBlcZJbV9pFixpPLkUBuVHJ14ixhldlm5PO6Zu72Hc293U9iCiNioYjK9Dakhu7pNP+lw++vfW7bfq4pQU1pkhY0R+r15FjREUrz1fkHqVwLosbD5YTaJbtxsPDc0JRFJccixpZFY/Lgc7N0/FVgjmrKhI4u+FEVSnBhuQxzTNZm1S1bu5wH9wQ979OssF41YZFQ5IV2Liub89dV0p//Y7r9GeNoOAbCllW32SB45ArqKKhBR6ycImQiw0JiVUtL16pWenwxDlBCunEZFZVscYGvIsGJ2r0+JycCJSXZ5yjD/J0uSVFW6Pi+0ylpKtejcXdsn9jj7pne6z6jY6WxupTfSU0LFnRRdERVx5//2vSf3Xleul0YOWZb1MFT9IYGdhZy9rI7StIQsV0Y+XKeZBVlj1dlkxdp9KLECl2o4LXSUOComsGmcr3ka9h5nLCUsBQQjUgHfAtblWHctLkzX3Kdy/d0P8jHrHB0bBkBWKxWGV9xv/Bv3td7G82dEglrK6uoHyFRaXSlqeOQiMrbKXmxkuVWiY8PCcwjljGm6kMzUSdVbwQuYFxduZFxyBouItOAJAVA6IxSkkPHNZqBPaN3cqDG2Pelw1dP69F0lcqGpqsALpzrulxvvqhN+W+2Z2wTOZWmYRXRqLuiiFniEQfyGPs85ZFZDROELDhu9xlpDovBa7g4ZS7+lpmiZVMP1YsL5yshODgSwfsjCZZeGE3nza4GjCbZzL/w5vfePMSz1QqnylT8V4kJjnMkB3/6k5l96Va/mt9HW378a3VgIYnKzA02Pvi3Vcof/WeG/wnsvG8i+mfqKtiRf/IsESlL1+PR3Bx9hoHXcSrFfDqSRlzZkXbPz/PdWRZAM2bC3iifMVLVG2WxdWFIq7rVoshlXyqu8l4p2EjExb5RhsoKt/y/MPrLnBOzFb1KH0enXCp/hMQWfvTbPwNA8o3r9o0+APcYrVgVZAVrl8upT3xa69L/vltW5x9ejATaJR5AfnCvOQNCYe6T8RPnvH4APiWyMGHqQnlhn5LvLLE5/bUCRIrmIExuGEz6qwLfoy4oddyMaWIEsknj6GBqcoB7wZZEQHpwWg1sbI03g6HkWoY/OCwTtWt3d7p37spyf5e17RV4f5GWBVkBTRNs/qyyn0fenP6/17RXRszvDzT4Mri5czchAqXkLtLFKAAICRKagCZ71GNx5UxkYqcLNIOxUUQ8eoBdLyUTE8r1JyE7/sLHh8cjxnVXFzjK/U1OlFRRHFXngJfQR/EJa2lrGEObVHRwQTeuOex9sBz7+gzdl6bcf++PZddka/AuBisGrICqWQyP9wq/ctvvjn+haFcqaL4RaaQhQ3bDymgmRh1UWFh4SqLlsTwOmclYqu0q2DVMe421wt4TseX5PFakLQcNxWePicS8VipJaZOIkl1fPzFAW9LQCooM0LCYkghyIo8hOeE4V0p32ZXZNzjr+9Tv3rJYO/9+Opqw6oiK9DZ3npqe2ft6x+4I/2jznjJVrwaGVbkLEpgNCCF5IV1pdRzZaYP2FU0TnAy0zHXj7oDA9QNVraURNW0WsKT5wRZ1ko2Jk0hYZh83cjgdVQeQFoUtKF1pQCg7QFvbuiRzdotbdZP++P+N89nzapGwqojKzA8NLDr7VfH/vKtV0jPZdW8q2F1RLjCPMNRB6Vk8xYnbOBs4jztc/YKLeCTQinw8aZ1AmjmShqbrinJYsVqE2fPjZihVzOGlCe/mbz7UKsbFMgteDfIN55hBMgFwJFG7m/Gqbq39qlPb0q6/5hNp0fF1dWHOqri0gFD7nqyxgMfvDP7iTu2B/uzSsXXJQxFJEtFLISxATnRL4eVESXJ5hkv+eT+gp104FNx7pK2g7Ahf5cdon1aY2NFOTsxU+sOT58ThmFUMxqbjMmBI1zIxgXPJ3hFKD1JHqKwFcMjsO5vlpn+jV3+wdev17+4tUGnvi0Uq5KsgK5p5mBO/+FvvTnzv25cXzmakUo+Rrhg0QVeV0UViHZEA9NcrRafaGfk7rBc735KiblUfx7JSy2jk+Xe8OQ5oSqKrdrmdIshFRXeBNO4wLNjXi78Xp4z5CngHEYqpaiKszVVPX3XevaV9Rn1q6vV/Y2waskKYHXEzV3aN3//HalPXT1YPhVTaoFEBJT4K5tIiT2QFeqskSVVRR2WNIHX83hAEwZCfQjLf5Xc4NG8nzt2Ot/HTy4A6Mo6cfRwsS+tTmoBeQ6NbF3BUypRMeABqfAooACN+TW2TiuU7hr0v7s1p/x1zDAW/A7bRsWqJiuQSaemt/foX/uPb0//2eW9+dFEMBkons00hZzicM4rr8OCk6QEWCoG57m7RS4xL9XrBipSqDCZKPqZmYrfhTWBwwvnRDaVKAyk1dNqgEEeSFxjAl6QhzxQyLKGhazBHNalVcw7evx7Lsuyz+YymVNh9FWNVU9WIJfNTFzer37p/7s78enbNxaPtSolJ3Bd3vwvaeEoJ8yB9R0qvV1ecoPAqq8whQgrGjfqAVE7q5iB2rF+e8ZxnAV332RTyXx/Rh5VPbx6pHEtK/LCkzyip+hy02WHpb2CfUe/8viNbcHn1/V0rdiXHy821gRZgbaW3NiNw6n/+yfv6/rPb7/SfSEjT7pyYM62BuN14dxdJNdYeI0hQeuq5yhNFEwjZ+MzXut0oTIQXjgnsunkdG8qOKb65PrjHUENC7zvJ8DiH1R4OiznV9zX9si737ou8Rdb1vf/JIy0JrBmyAokE4nipq7Yv/yHt8f/9G1X27vaYhVHcqpMZRaV2D4pBIaHo8ODrC3xBCpO3K0reHMKEXYs77eNT5UHw9PnRDIeL7TFpJMpxTPDYqcxQW4PJlfEqO6ddsveDa3+wXdvMP6qP2P8M6ZJhrHWBNYUWQFD12vr2+Lf+8g7cx9726Xm853GlK14ZeZT5dV3SRwY1Qftpt1A8elQuF/1gmjrktnJSbPj6MnJDeHpcwLDLzXHnuhK6QV0ADUqFBSgVEUxrJJ/bQs78XMb9L/dmNG/pCqKFUZZM1hzZAU4YVvj3//IO7N/9PPXSc90JV0bfXk+KrFEDvKMiSAekdWB70Wn6mdeRUeFzI6PV1pPThYH8XjiyqsDVmf65PHpgZb4aZ4ojldPR/1S+cpAQmE7E5IcXJZTT79rg/zF7S3aX8YMoyRirC2sSbICvB+2Nfaj37yr5b/9/PXSE/3psqlLFl+/B/2vvBkyJApvYJrVZNqBBqEflgdB5bkgPkF49OFie1GQqEYtq2ysGCTjvZu6PM8zwivnRFs2MzGUMw7zoXoM84nwesy5vmNsEHCE8bZRENfxnUV4/lcAF2cYoqGDkfcimtTEkFA8c9yrBVtilcm7N7CvXtqifo7c+2kRc+1hzZIVgKs42Ba/57femv4v//rW4IH1melqjNVIQVEVInfY1xlzoEmhoEjpMX+S4aWK/J2w4ZQcXISy8W2o6BSXz7kEry9C4fFVN1BYNUjJJ6fVzsl8eZ24cm60tWTH1uf0A3Lg8kYmrEqPYRbot8TzYpAIng1kmSUrpQHHuIA0cNJcxPMD+H50D2wQBEnDcb50Rlzm7wQkZ8anZ/OYETjBplh15ueH3H+8ul3+dDadIi9h7WJNkxXA0MSuTOyhX78j/V8/dFfih+tSo8WkVCSFcUk4RDgFmisUTHySZSJlCrjlRYMUiVBc5FthhUnFaYOpeCBGZDUuCER21FkdKcYOT8hdx0cLm8Mr50QqkZhJeJVjaYVZGhEjCDApHw9Jz0cbUcaAkALzn5MTLNxfDEBEPNBNsQWwj9Z4yBit8VjjDR3fWOs3bpeDYb0y83MblX+8qlP/RGs2cyL82prFmicrgDfVtaX0J3755th/+fAbta9ty01PpxhVi1y8ooNKeVIk3rWDTnks88/fB0tWF41RZGRhPbFIGwLqvlBzn076qk1RHFJKinChoNthpUYmG+ylUbfnyEhxS3jlnIDnMHP08MhQVj2NNXSpAk5EwVRtAreadHviCHgSBU5SCnPgsS8edBvclodwHwWb6OOmZ/Fg+Ymo9BBx33Ivz1mjv7zR/fL1HcEn2xvsbW9LhSZZQ2CIXiYV2/PWq+Mf+4N3pf7PNYOFkYw2Q15hlfjqMM9zWYC1TemfmEjk5TZ1VtkVEJbCnNtLGgmSIVwMYAIJGBJ5ZDzo0LL9w+fz7puutuz4tnbtoOJaVNCAskRYKlDwh2GVeDr+/GE6kCahFLhykc8eIrLY3FOh34wKBfonYKQYncMEcirUcqziXt1iHvrXO2KfvnUw/dGuttaDPFoTTPnoRz8a7jYBpFLJQncmeP7yjfrkVKmyYXSqlnOZTrqsMpUsqkTWFMrOFZqUEJZhlrTYhjoe8DVjQtUnNzbU1/MG3FT8CJpcXNeVL+1np3b0+g/HDb0QRnlVECEVV9M3PXK0cp2lpyRHQoMZZTx98Ho17Yu+XIorNrNk4udpy08iXCBwCxAVllPG79IxBuTDCYGENEpfjFKYkyz3mlztpfdujX1ue1viL+Kx2ILSuFbQJOsrIGYYtfaUsufqDfpRN3AHT01U2qs1T4fbK5N1grGDAuKTK3VoPaHsUMDIknB1p4PZwwuAUG6h7qjfDbb4xc0txT3d7dkFWRxd02wqKwYfPFp+Q0FOqA5/bTzIiqfDvfF0tMc3IlXY5cULDnEARNsLAH4HLbxiBlBYh6eA30Yjl0F16ZagbN/U4e39hW2pz25ujf+trutV8e0mIjTJ+jOgKoqbi2sHr+iX9zCn0DpTZb3TBS/mMU0KUG8lywmS8kDx8V5YTwx+4hSAdYJbPKvjF6js6L7AzcTrLBkzWEXelJk8vH1j96NhlFcFGtCcmtn7YkG69ZipZh28rYCeDfVgPJIIICt+Q5AJROXn6BqINVf4XChEgSMCgX5bWNqAxSSPtSqOfVtP8MJ7t8Q+vTEX+xLVtU3+tSbOALyQJn4G0PDU1ZJ64ldvyX3kP9ypf+72LdbJjtikqwcVcod9bmGJSrydSYx0QmOSS1/EWVJ+/ndx4Fac6nS4DybOHxp32tVM//D59LfOTI6Pbu0w9slkwfjC3yAgnYcXIPpV6YCTNXpm3kElvATc4KIg7oAiwKNqhE+WHfVWtLYnvCrrDIrmnf1s5/u2Jj6xPhv7iqqqa25k0kLRtKwLQJrqseta5Weu3KCecr3q4OhEtaVqK5onkUtMms/fS44WGlJAiTm81VhYKroGK3wxgGtKpJFlmG0qEDxL2dyjTmzpcp5MJWKTYaxXhYJV44zY+gdOmDfZSozbVPRtAsKG0nPS7/hotabf4svb8HN8g/8LBi9ssMV0RLoTPBHNJ//ErbEe3am8sdt98F0btI/3ZePfReEovtXEK6FJ1gVC1zWrI63tvWZjfHc2obYdHSn0lyzJ4ISN1BmKzUlFO4pCiqkQucLzIsZ5I3K1+YLdxCGUCy1x2RpKTR1Y39u6W8R6dWC0VsWs9j057r6h6Cg61kdWVDiiuDdioKuJChcKOAzbuXGB40KfnYMqxxIF3i1NkDHON7DZuoRbvqvf/8HruvyPretue4jSGMZo4meh6QafB/CGto507BH0x37oDvnLl3Xmp5LBdKAKm0HSROMTBYx8somoDn3pIiXMa3rcNGHPJ1LpbO8p1rP/RHlrECysNol668yJY6Obs8pxvK9UIXcY9+MLgKMgoGfkdWKANnCD8bkYwLLNDgXUkw0iapLqqF30ELe32/fe0mJ/Ynig56kwahPnQNOyXgAMXZ3sSdu7NvWqVqlSGSiV7YTlBlgRkxMWeq6S0mMOJreswIJo9XJElMGLofm7e4hZlu3H3nBd28iOXunehc4+sR07YevJ7bvHKttcNcZcdEERWWVFrEkVPR82onyh4ofKAn76Ap8dQBeR4mG1fI9lVTcY1GuFN/daP7y9w/nE5nX9T4TRmlgAmmS9QKSSicJgm/bkLVvje3Oa05ovFLNVV9Mdn/xgUn4yIEyyaAdmUfSTXDjI6vGGIT4xXiGX2JeGWtzCptbSrrZc6ngY61Wha6qt6WrvzhPFW8rMUF2m0T1RApBlDRmJDe97pQTAFQ6piksXBPIJmO47LBWYLMtq7ua0O/rujcFXXtst//G6nq5dYbQmFogmWS8Cqqq42YR+8KoNsfuu2aCdSMhedmoy32JadgyEUnWFvxiKryF0gQrPEX5dxcgpIhiWD4uxsjSUnT6yZX3ngqwThh7Kjp08WvGvOlwKunxFp3tiFQoqT2BK6Qd4lw7dXYwyohO4gB9GuABgqVC43e2saN3Yox54zxb9/1zbof9ZSyYzEkZp4jzQJOsiQFHkSndOf+76jcpjAxnbr9YqPQXTiRc9T7PR7YJGp4vRevoaXFKMO0Zjkyz5zDan4zdc3TKyrdu4T5Fl1I5fFfheuVRy9XS294kR82on0ImJqlgJI+QkCBqRVVhWsDjEAh8d1lTcy8d7UoNew67c2uE8cfdG/ZPb2pP/sFbnoi4GmmRdJIAM5GpOb+jWHrt+k7FbcfMZ0y231hzbcDywFa3E4EVIAJAkBIwYP8EbRIWywwWN2kfp1qT8FGAFcUwHjlNV1uX88uY2+4WWTHJBq/vhtRqBayX35NnNk6aUkSQMMRYs5PenwH+XUxZdN3QtfAjuhofXAXxy44ttuI8GXTS2GV6Nu73DSXviLf3+d9/Qzf77pt7Oe+VVvq7vUqNJ1kWGqqpOS9o4dNmA+sD1G40RTaq25itBumoxw3fJNcbYXCKdLxgqiMpZACZCl30iBjmoUTxcpjic4uHgCCw9hNk/miIr/fHJk1vWtz+BwuJcILL4k2OjupduueT5sdolHjOo/isTwQRRAU5SBGJnQKUDhkfA0sI3QFeyILMgKJ4NLckYWIEzGlXU436NdbKieUsX2/9LW2J/eWOX9j972tteQowmLg5Nsi4R4rFYpacl8dx1w6mHB1s8U2Zmq10pJSqVmoHJO7JGVi0aTgT1xz4FCf2zqEuidwVXhEGetWI4xgw9lyqbhUIp9dor2ya39Cj3LbRV2NA1s2ZXe3aO+7eakqHg9dHiEdCwFAFWVfymRM+k4Jnox10HBQo9Jp1zUZDQdQVMB5ldh2WCsr/BqOVf1+U9fPdw8uOXtCe/lIjFVv3i28uFJlmXEGTtghi5xpu6jEdu3qw90RorqQGrtNqepVcdV3fJLIEisIp4Hyx/nwsRmap7ZKKJCdzkUYBZI4CsmH+D1mV8M7AtuS/t19bnKns7WtNHRKxXh6Hr5rH9+7PjetuNR6us1aVCA6OXsPqFxN+iB+bi7iCrxOu0ICYGUmAUEsg7+0wgs++zGN7ippvWNTnryLuHtX+4rUf/7wPtLY83RyQtLppkXQbA/UzF9JFt/cn7b96SfCaplGKBb+Y8xyIzZ+mYdsdbXkPiztYVEQi8vxN8wnnaD4jNmAxvEBd8u2J0G5Ojl27qegSFA//COUB3UJV4esPOEfNST4uRU02OL1xr3Jeu01NQoE88ApHTpwDS8p4euk78pPozZst4rFU23Y1GOX9ztvTEezbFP3l5V/qvsunUGP+hJhYVTbIuI1CfzSWNo1esS95z65b4s1m5ZKiSl/XdQHN9RSdPkkDE1IgZZK1k1+UtwHj7ukpbGFuQxyO3k8wqkddihXIhec1l3TPbe5Sfkotb5j90DsQNverbtfZnx73bS56mY3A9KArLzolKt0f9FAHPg3WZ0KjF7S39y+THJ/yavz5WK72u29n9no3q39/So/6Poa62B8kdP2fLdBMXhiZZ6wBNVe1cKnb48vXJe27ZGnsmo5YVJaikZL+qSIGne7bDnVFN1bi3CWuHUUawbgG5wKhLAjwSWbmErnr9semj63tb9ogrrw4UGqeOHU1a8bbLD007fb5scMuuhNY9GnooJohT4UEmFi+iliybpchV7tVM68qseezuDewbbx9OfXRje+obqURiin+piSVDk6x1BCdt0jh85YbEj167w3ikP11yY1IxoXiO6ti+ZlkB8YfIo2BMsI+38NA+0Zesq4R5qZJOrqrBymU31cGOTV2zrfN+IuKCukd0XXWMRLznqePW9XZgEEuF24uWYJfu71DAFpPfMQopHjisw/DcDXpx+jUt5Uffe0nif17Zk/l8MmacDG/ZxBKjSdYVAAy0T8X1U1sHMz+59dLsT9a32pOqN6Vlk5IiB1XJditaIPkyxu0H6BuF5SOLCmvrUqjZpnbF5lZrc5v5Yks2taBVANFa7TlmZv+Md8uEKWccui+6YPBSAr4cKW9AIqJ6Fst5ZX9QqxVv6Qp2/+KWxF/e0hv/47623OOY2CDu1sRyoEnWFQQ0RMU0dWpTf/rRW7envnn7DmPnhnarkk44uoJ3e1iB6tqS6mMkE1k9LEURaB7zyZiaZjHerY6P79jQ9Sjdhyj86kBj1MzEmKplshueGre2morB3/+OqXJocVbJkscCM+iVKtUb2v3D7xjS/uktQ4mPDbUm/yUeW/3vQl2JaJJ1hQLzZ3Mp48i2gdQ9r92e/uFlfcGxVrUc5AxX1zFDQDJVx60ogVsj3zVgxYqZvHpLZ3F7t4zF1BZEpkQsVvbcWvaZSfvWcqAbcIE1yWVpqRJ0saJ5edo58dZ+9uO7h+Mf39GZ+pumy1tfNMm6wgELqKtKYaA98ewNW1LfesMVxn3DLYWJuHOStaVlOabrvu8qqm9JiuLJWm9semyoL/fcQrpx0NA0OXJSDZLpLYeny0Mas4MuuWpekaqdemOn98B7NiY+eUNf5jOtycQ+pTlUsO6Q+Cv5m2g4mJaVmKl6Ox7fm3/jw3sKNx2fkTdVirWWD9zR8eO7rm37cDy+sCVfSpVKbtdU5d9+4dnT/ykVT+Qv74jvvLkv8dX+bOLeuGE0lwJdQWiSdRXAcV29bLqbnn3x1FvLhZmOSzd1fm1o/eDO8PI58fzuPTeOWOznhvu6nuzPpe6Jx2L58FITKwhNsjbRRIMAveBNNNFEA6BJ1iaaaBA0ydpEEw2CJlmbaKJB0CRrE000CJpkbaKJBkGTrE000SBokrWJJhoETbI20USDoEnWJppoCDD2/wOaS9FAqAG4vgAAAABJRU5ErkJggg==",
  "data:image/png;base64,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",
  "data:image/png;base64,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",
];

const guardarImagen = async (body) => {
  try {
    const { foto } = body;
    console.log(body, "body")
    const arrayFoto = foto;
    const rutaDestino = `C:\\Users\\Programadores\\Desktop`;

    if (!fs.existsSync(rutaDestino)) {
      console.error("La ruta de destino no existe.");
      return { error: "La ruta de destino no existe" };
    }

    for (let index = 0; index < arrayFoto?.length; index++) {
      const foto = arrayFoto[index];
      const nombreArchivo = `imagen_${index}.png`;
      const rutaCompleta = path.join(rutaDestino, nombreArchivo);

      const base64Data = foto.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      await new Promise((resolve, reject) => {
        fs.writeFile(rutaCompleta, buffer, (err) => {
          if (err) {
            console.error(`Error al guardar ${nombreArchivo}: ${err.message}`);
            reject(err);
          } else {
            console.log(`Imagen ${nombreArchivo} guardada correctamente.`);
            resolve();
          }
        });
      });
    }
    return {
      message: "Todas las imágenes se guardaron correctamente en el escritorio",
    };
  } catch (error) {
    console.error("Error al guardar las imágenes:", error);
    return { error: "Error al guardar las imágenes" };
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
  funcionPrueba,
};
