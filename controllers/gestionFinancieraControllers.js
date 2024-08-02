const { conectar_BD_GAF_MySql } = require("../config/dbEstadisticasMYSQL");
const { sequelize } = require("../config/sequelize");
const DetMovimiento = require("../models/Financiera/DetMovimiento");
const Movimiento = require("../models/Financiera/Movimiento");
const Expediente = require("../models/Financiera/Expediente");
const { obtenerFechaEnFormatoDate } = require("../utils/helpers");

const listarAnexos = async (req, res) => {
  let connection;
  try {
     connection = await conectar_BD_GAF_MySql();
      // Verifica si hay un término de búsqueda en los parámetros de la solicitud
      const searchTerm = req.query.searchTerm || '';

      let sqlQuery = 'SELECT * FROM anexo';

      // Agrega la cláusula WHERE para la búsqueda si hay un término de búsqueda
      if (searchTerm) {
          // sqlQuery += ' WHERE anexo_codigo LIKE ? OR anexo_det LIKE ?';
          sqlQuery += ' WHERE LOWER(anexo_codigo) LIKE LOWER(?) OR LOWER(anexo_det) LIKE LOWER(?)';
      }

      const [anexos] = await connection.execute(sqlQuery, [`%${searchTerm}%`, `%${searchTerm}%`]);

      //  await connection.end();
      res.status(200).json({ anexos });
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const agregarAnexo =async(req,res)=>{
  let connection;
    try {
        const {codigo, descripcion} = req.body;
         connection = await conectar_BD_GAF_MySql();

        const [anexo] = await connection.execute(
            "SELECT * FROM anexo WHERE anexo_codigo = ?",
            [codigo]
          );
            console.log(anexo);
            if(anexo.length > 0){
                res
                .status(400)
                .json({
                  message: "anexo ya existente",
                  Anexo: anexo[0].anexo_det,
                });
            }else {
                const [result] = await connection.execute(
                    'INSERT INTO anexo (anexo_codigo,anexo_det) VALUES (?,?)',[codigo, descripcion]
                );
                //  await connection.end();
                res.status(200).json({ message: "Anexo creado con éxito" })
            }
    } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }finally {
      // Cerrar la conexión a la base de datos
      if (connection) {
        await connection.end();
      }
    }
}

const editarAnexo = async (req,res) =>{
  let connection;
    try {
        const { codigo, descripcion } = req.body;
        const anexoId = req.params.id;
    
        const sql =
          "UPDATE anexo SET anexo_codigo = ?, anexo_det = ? WHERE anexo_id = ?";
        const values = [codigo, descripcion, anexoId];
    
         connection = await conectar_BD_GAF_MySql();
        const [anexo] = await connection.execute(
          "SELECT * FROM anexo WHERE anexo_codigo = ? ",
          [codigo]
        );
     console.log(anexo);
        if (anexo.length == 0 || anexo[0].anexo_id == anexoId) {
          const [result] = await connection.execute(sql, values);
          // El resultado puede contener información sobre la cantidad de filas afectadas, etc.
          console.log("Filas actualizadas:", result.affectedRows);
          //  await connection.end();
          res
            .status(200)
            .json({ message: "anexo modificado con exito", result });
        } else {
          res
            .status(400)
            .json({
              message: "anexo ya existente",
              Anexo: anexo[0].anexo_det,
            });
        }
      } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
      }finally {
        // Cerrar la conexión a la base de datos
        if (connection) {
          await connection.end();
        }
      }
}

const borrarAnexo = async (req, res) => {
    const { id } = req.body;
  
    const sql = "DELETE FROM anexo WHERE anexo_id = ?";
    const values = [id];
    let connection;
  
    try {
       connection = await conectar_BD_GAF_MySql();
      const [result] = await connection.execute(sql, values);
      //  await connection.end();
      if (result.affectedRows > 0) {
        res.status(200).json({ message: "Anexo eliminado con éxito"});
      } else {
        res.status(400).json({ message: "Anexo no encontrado"});
      }
    } catch (error) {
      console.error("Error al eliminar el rol:", error);
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }finally {
      // Cerrar la conexión a la base de datos
      if (connection) {
        await connection.end();
      }
    }
  };

// const listarEjercicios = async (req, res) => {
//   const connection = await conectar_BD_GAF_MySql();
//   try {
//       // Verifica si hay un término de búsqueda en los parámetros de la solicitud
//       const searchTerm = req.query.searchTerm || '';

//       let sqlQuery = 'SELECT * FROM ejercicio';

//       // Agrega la cláusula WHERE para la búsqueda si hay un término de búsqueda
//       if (searchTerm) {
//           // sqlQuery += ' WHERE anexo_codigo LIKE ? OR anexo_det LIKE ?';
//           sqlQuery += ' WHERE LOWER(ejercicio_anio) LIKE LOWER(?) OR LOWER(ejercicio_det) LIKE LOWER(?)';
//       }

//       const [ejercicios] = await connection.execute(sqlQuery, [`%${searchTerm}%`, `%${searchTerm}%`]);

//        await connection.end();
//       res.status(200).json({ ejercicios });
//   } catch (error) {
//       res.status(500).json({ message: error.message || "Algo salió mal :(" });
//   }
// };

const agregarEjercicio =async(req,res)=>{
  let connection;
    try {
        const {anio, descripcion} = req.body;
         connection = await conectar_BD_GAF_MySql();

        const [ejercicio] = await connection.execute(
            "SELECT * FROM ejercicio WHERE (ejercicio_anio,ejercicio_det) = (?,?)",
            [anio,descripcion]
          );
          
            if(ejercicio.length > 0){
                res
                .status(400)
                .json({
                  message: "ejercicio ya existente",
                  Ejercicio: ejercicio[0].ejercicio_det,
                });
            }else {
                const [result] = await connection.execute(
                    'INSERT INTO ejercicio (ejercicio_anio,ejercicio_det) VALUES (?,?)',[anio, descripcion]
                );
                //  await connection.end();
                res.status(200).json({ message: "Ejercicio creado con éxito" })
            }
    } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }finally {
      // Cerrar la conexión a la base de datos
      if (connection) {
        await connection.end();
      }
    }
}

const editarEjercicio = async (req,res) =>{
  let connection;
    try {
        const { anio, descripcion } = req.body;
        const ejercicioId = req.params.id;
    
        const sql =
          "UPDATE ejercicio SET ejercicio_anio = ?, ejercicio_det = ? WHERE ejercicio_id = ?";
        const values = [anio, descripcion, ejercicioId];
    
         connection = await conectar_BD_GAF_MySql();
        const [ejercicio] = await connection.execute(
          "SELECT * FROM ejercicio WHERE (ejercicio_anio,ejercicio_det) = (?,?)",
          [anio,descripcion]
        );
   
        if (ejercicio.length == 0 || ejercicio[0].ejercicio_id == ejercicioId) {
          const [result] = await connection.execute(sql, values);
          //  await connection.end();
          // El resultado puede contener información sobre la cantidad de filas afectadas, etc.
          console.log("Filas actualizadas:", result.affectedRows);
          res
            .status(200)
            .json({ message: "ejercicio modificado con exito", result });
        } else {
          res
            .status(400)
            .json({
              message: "ejercicio ya existente",
              Ejercicio: ejercicio[0].ejercicio_det,
            });
        }
      } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
      }finally {
        // Cerrar la conexión a la base de datos
        if (connection) {
          await connection.end();
        }
      }
}

const borrarEjercicio = async (req, res) => {
    const { id } = req.body;
  
    const sql = "DELETE FROM ejercicio WHERE ejercicio_id = ?";
    const values = [id];
  let connection;
    try {
       connection = await conectar_BD_GAF_MySql();
      const [result] = await connection.execute(sql, values);
      //  await connection.end();
      if (result.affectedRows > 0) {
        res.status(200).json({ message: "Ejercicio eliminado con éxito"});
      } else {
        res.status(400).json({ message: "Ejercicio no encontrado"});
      }
    } catch (error) {
      console.error("Error al eliminar el ejercicio:", error);
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }finally {
      // Cerrar la conexión a la base de datos
      if (connection) {
        await connection.end();
      }
    }
  };

const listarFinalidades = async (req, res) => {
  let connection;
  try {
     connection = await conectar_BD_GAF_MySql();
      // Verifica si hay un término de búsqueda en los parámetros de la solicitud
      const searchTerm = req.query.searchTerm || '';

      let sqlQuery = 'SELECT * FROM finalidad';

      // Agrega la cláusula WHERE para la búsqueda si hay un término de búsqueda
      if (searchTerm) {
          // sqlQuery += ' WHERE anexo_codigo LIKE ? OR anexo_det LIKE ?';
          sqlQuery += ' WHERE LOWER(finalidad_codigo) LIKE LOWER(?) OR LOWER(finalidad_det) LIKE LOWER(?)';
      }

      const [finalidades] = await connection.execute(sqlQuery, [`%${searchTerm}%`, `%${searchTerm}%`]);

      //  await connection.end();
      res.status(200).json({ finalidades });
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const agregarFinalidad =async(req,res)=>{
  let connection;
    try {
        const { descripcion,codigo} = req.body;
         connection = await conectar_BD_GAF_MySql();

        const [finalidad] = await connection.execute(
            "SELECT * FROM finalidad WHERE finalidad_codigo = ?",
            [codigo]
          );
          
            if(finalidad.length > 0){
                res
                .status(400)
                .json({
                  message: "finalidad ya existente",
                  finalidad: finalidad[0].finalidad_det,
                });
            }else {
                const [result] = await connection.execute(
                    'INSERT INTO finalidad (finalidad_codigo,finalidad_det) VALUES (?,?)',[codigo,descripcion]
                );
                //  await connection.end();
                res.status(200).json({ message: "finalidad creada con éxito" })
            }
    } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }finally {
      // Cerrar la conexión a la base de datos
      if (connection) {
        await connection.end();
      }
    }
}

const editarFinalidad = async (req,res) =>{
  let connection;
  try {
    const { codigo, descripcion } = req.body;
    const finalidadId = req.params.id;

    const sql =
      "UPDATE finalidad SET finalidad_codigo = ?, finalidad_det = ? WHERE finalidad_id = ?";
    const values = [codigo, descripcion, finalidadId];

     connection = await conectar_BD_GAF_MySql();
    const [finalidad] = await connection.execute(
      "SELECT * FROM finalidad WHERE finalidad_codigo = ? ",
      [codigo]
    );
 
    if (finalidad.length == 0 || finalidad[0].finalidad_id == finalidadId) {
      const [result] = await connection.execute(sql, values);
      //  await connection.end();
      // El resultado puede contener información sobre la cantidad de filas afectadas, etc.
      console.log("Filas actualizadas:", result.affectedRows);
      res
        .status(200)
        .json({ message: "finalidad modificada con éxito", result });
    } else {
      res
        .status(400)
        .json({
          message: "finalidad ya existente",
          Finalidad: finalidad[0].finalidad_det,
        });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
}

const borrarFinalidad = async (req, res) => {
    const { id } = req.body;
  
    const sql = "DELETE FROM finalidad WHERE finalidad_id = ?";
    const values = [id];
  let connection;
    try {
       connection = await conectar_BD_GAF_MySql();
      const [result] = await connection.execute(sql, values);
      //  await connection.end();
      if (result.affectedRows > 0) {
        res.status(200).json({ message: "finalidad eliminada con éxito"});
      } else {
        res.status(400).json({ message: "finalidad no encontrada"});
      }
    } catch (error) {
      console.error("Error al eliminar la finalidad:", error);
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }finally {
      // Cerrar la conexión a la base de datos
      if (connection) {
        await connection.end();
      }
    }
  }

const listarFunciones = async (req, res) => {
  let connection;
  try {
     connection = await conectar_BD_GAF_MySql();
      // Verifica si hay un término de búsqueda en los parámetros de la solicitud
      const searchTerm = req.query.searchTerm || '';

      let sqlQuery = 'SELECT funcion.*, finalidad_det FROM funcion LEFT JOIN finalidad ON funcion.finalidad_id = finalidad.finalidad_id';

      // Agrega la cláusula WHERE para la búsqueda si hay un término de búsqueda
      if (searchTerm) {
          
          sqlQuery += ' WHERE LOWER(funcion_codigo) LIKE LOWER(?) OR LOWER(funcion_det) LIKE LOWER(?)';
      }
      const [funciones] = await connection.execute(sqlQuery, [`%${searchTerm}%`, `%${searchTerm}%`]);
      console.log(funciones);
//  await connection.end();
      res.status(200).json({ funciones });
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const agregarFuncion =async(req,res)=>{
  let connection
  try {
      const { descripcion,codigo,finalidad_id} = req.body;

       connection = await conectar_BD_GAF_MySql();

      const [funcion] = await connection.execute(
          "SELECT * FROM funcion WHERE funcion_codigo = ?",
          [codigo]
        );
        
          if(funcion.length > 0){
              res
              .status(400)
              .json({
                message: "funcion ya existente",
                funcion: funcion[0].funcion_det,
              });
          }else {
              const [result] = await connection.execute(
                  'INSERT INTO funcion (funcion_det,funcion_codigo,finalidad_id) VALUES (?,?,?)',[descripcion,codigo,finalidad_id]
              ); 
              // await connection.end();
              res.status(200).json({ message: "funcion creada con éxito" })
          }
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
}

const editarFuncion = async (req,res) =>{
  let connection
  try {
    const { codigo, descripcion, finalidad_id } = req.body;
    const funcionId = req.params.id;

    const sql =
      "UPDATE funcion SET funcion_codigo = ?, funcion_det = ?, finalidad_id = ? WHERE funcion_id = ?";
    const values = [codigo, descripcion,finalidad_id, funcionId];

     connection = await conectar_BD_GAF_MySql();
    const [funcion] = await connection.execute(
      "SELECT * FROM funcion WHERE funcion_codigo = ? ",
      [codigo]
    );
 
    if (funcion.length == 0 || funcion[0].funcion_id == funcionId) {
      const [result] = await connection.execute(sql, values); 
      // await connection.end();
      // El resultado puede contener información sobre la cantidad de filas afectadas, etc.
      console.log("Filas actualizadas:", result.affectedRows);
      res
        .status(200)
        .json({ message: "función modificada con éxito", result });
    } else {
      res
        .status(400)
        .json({
          message: "función ya existente",
          Funcion: funcion[0].funcion_det,
        });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
}

const borrarFuncion = async (req, res) => {
  const { id } = req.body;

  const sql = "DELETE FROM funcion WHERE funcion_id = ?";
  const values = [id];
let connection;
  try {
     connection = await conectar_BD_GAF_MySql();
    const [result] = await connection.execute(sql, values); 
    // await connection.end();
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "funcion eliminada con éxito"});
    } else {
      res.status(400).json({ message: "funcion no encontrada"});
    }
  } catch (error) {
    console.error("Error al eliminar la funcion:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};


const listarItems = async (req, res) => {
  let connection;
  try {
     connection = await conectar_BD_GAF_MySql();
      // Verifica si hay un término de búsqueda en los parámetros de la solicitud
      const searchTerm = req.query.searchTerm || '';

      let sqlQuery =  'SELECT item.*, anexo_det, finalidad_det, funcion_det, organismo_det FROM item ' +
      'LEFT JOIN anexo ON item.anexo_id = anexo.anexo_id ' +
      'LEFT JOIN finalidad ON item.finalidad_id = finalidad.finalidad_id ' +
      'LEFT JOIN funcion ON item.funcion_id = funcion.funcion_id ' +
      'LEFT JOIN organismo ON item.organismo_id = organismo.organismo_id'

      // Agrega la cláusula WHERE para la búsqueda si hay un término de búsqueda
      if (searchTerm) {
          
          sqlQuery += ' WHERE LOWER(item_codigo) LIKE LOWER(?) OR LOWER(item_det) LIKE LOWER(?)';
      } 
      const [items] = await connection.execute(sqlQuery, [`%${searchTerm}%`, `%${searchTerm}%`]);
      // await connection.end();
      res.status(200).json({ items });
  } catch (error) {
    console.log(error);
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const listarItemsFiltrado = async (req, res) => {
  const cuil=req.params.cuil
  let connection;
  try {
     connection = await conectar_BD_GAF_MySql();
      // Verifica si hay un término de búsqueda en los parámetros de la solicitud
      const searchTerm = req.query.searchTerm || '';

      let sqlQuery =  `CALL sp_items(${cuil})`

      // Agrega la cláusula WHERE para la búsqueda si hay un término de búsqueda
      if (searchTerm) {
          
          sqlQuery += ' WHERE LOWER(item_codigo) LIKE LOWER(?) OR LOWER(item_det) LIKE LOWER(?)';
      } 
      const [items] = await connection.execute(sqlQuery, [`%${searchTerm}%`, `%${searchTerm}%`]);
      await connection.end();
      res.status(200).json({ items });
  } catch (error) {
    console.log(error);
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const agregarItem =async(req,res)=>{
  let connection;
  try {
      const {codigo, descripcion,anexo_id,finalidad_id,funcion_id,fechaInicio,fechaFin,organismo_id} = req.body;
       connection = await conectar_BD_GAF_MySql();
console.log(req.body);
      const [item] = await connection.execute(
          "SELECT * FROM item WHERE item_codigo = ?",
          [codigo]
        );
         
          if(item.length > 0){
              res
              .status(400)
              .json({
                message: "item ya existente",
                Item: item[0].item_det,
              });
          }else {
              const [result] = await connection.execute(
                  'INSERT INTO item (item_codigo,item_det,anexo_id,finalidad_id,funcion_id,organismo_id) VALUES (?,?,?,?,?,?)',[codigo, descripcion,anexo_id,finalidad_id,funcion_id,organismo_id]
              ); 
              // await connection.end();
              res.status(200).json({ message: "Item creado con éxito" })
          }
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
}

const editarItem = async (req,res) =>{
  let connection;
  try {
      const { codigo, descripcion,anexo_id,finalidad_id,funcion_id,fechaInicio,fechaFin, organismo_id ,item_observaciones} = req.body;
      const itemId = req.params.id;
console.log(req.body);
      const sql =
        "UPDATE item SET item_codigo = ?, item_det = ?, anexo_id = ?, finalidad_id = ?, funcion_id = ?, organismo_id = ?,item_observaciones = ? WHERE item_id = ?";
      // const values = [codigo, descripcion,anexo_id,finalidad_id,funcion_id,fechaInicio.includes("T")? obtenerFechaEnFormatoDate(fechaInicio): fechaInicio,fechaFin.includes("T")? obtenerFechaEnFormatoDate(fechaFin): fechaFin, itemId];
      const values = [codigo, descripcion,anexo_id,finalidad_id,funcion_id,organismo_id,item_observaciones, itemId];
  
       connection = await conectar_BD_GAF_MySql();
      const [item] = await connection.execute(
        "SELECT * FROM item WHERE item_codigo = ? ",
        [codigo]
      );

      if (item.length == 0 || item[0].item_id == itemId) {
        const [result] = await connection.execute(sql, values); 
        // await connection.end();
        // El resultado puede contener información sobre la cantidad de filas afectadas, etc.
        console.log("Filas actualizadas:", result.affectedRows);
        res
          .status(200)
          .json({ message: "item modificado con exito", result });
      } else {
        res
          .status(400)
          .json({
            message: "Item ya existente",
            Item: item[0].item_det,
          });
      }
    } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }finally {
      // Cerrar la conexión a la base de datos
      if (connection) {
        await connection.end();
      }
    }
}

const borrarItem = async (req, res) => {
  const { id } = req.body;

  const sql = "DELETE FROM item WHERE item_id = ?";
  const values = [id];
  let connection;

  try {
     connection = await conectar_BD_GAF_MySql();
    const [result] = await connection.execute(sql, values); 
    // await connection.end();
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Item eliminado con éxito"});
    } else {
      res.status(400).json({ message: "Item no encontrado"});
    }
  } catch (error) {
    console.error("Error al eliminar el item:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const listarPartidas =async(req,res)=>{
  let connection;
  try {
     connection = await conectar_BD_GAF_MySql();
      // Verifica si hay un término de búsqueda en los parámetros de la solicitud
      const searchTerm = req.query.searchTerm || '';

      let sqlQuery =  'SELECT * FROM partidas ORDER BY partida_codigo'

      // Agrega la cláusula WHERE para la búsqueda si hay un término de búsqueda
      if (searchTerm) {
          
          sqlQuery += ' WHERE LOWER(partida_codigo) LIKE LOWER(?) OR LOWER(partida_det) LIKE LOWER(?)';
      }
      const [partidas] = await connection.execute(sqlQuery, [`%${searchTerm}%`, `%${searchTerm}%`]);
      // await connection.end();
      res.status(200).json({ partidas });
  
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
}

const listarPartidasConCodigo =async(req,res)=>{
  let connection;
  try {
  
       connection = await conectar_BD_GAF_MySql();
      const gastoOCredito = req.query.gastoOCredito;

      const [partidas] = await connection.execute(
         `SELECT partida_id,CONCAT(partida_codigo, ' _ ', partida_det) AS partida FROM partidas WHERE ${gastoOCredito == "gasto"? "partida_gasto = 1":"partida_credito = 1" } ORDER BY partida_codigo`
      );
      console.log(partidas); 
      // await connection.end();
      res.status(200).json({partidas})
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
}

const agregarPartida = async (req, res) => {
  let connection;
  try {
    const {
      id,
      seccion,
      sector,
      principal,
      parcial,
      subparcial,
      codigo,
      descripcion,
      partidapadre_id,
      gasto,
      credito,
      creditoanteproyecto
    } = req.body;
     connection = await conectar_BD_GAF_MySql();

    const [result] = await connection.execute(
      "SELECT sp_insertpartidas(?,?,?,?,?,?,?,?,?,?)",
      [
        seccion,
        sector,
        principal,
        parcial,
        subparcial,
        descripcion.toUpperCase() ,
        partidapadre_id,
        gasto,
        credito,
        creditoanteproyecto
      ]
    );
    console.log(result);
    // await connection.end();
    if (result[0]["sp_insertpartidas(?,?,?,?,?,?,?,?,?,?)"] === 0) {
      res.status(400).json({
        message: "partida ya existente",
        Item: result[0].partida_det,
      });
    } else {
      res.status(200).json({ message: "Partida creada con éxito" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

  const editarPartida = async (req, res) => {
    let connection;
    try {
      const { id, seccion, sector, principal, parcial, subparcial, codigo, descripcion, partidapadre_id, gasto, credito ,creditoanteproyecto} = req.body;
      const partidaId = req.params.id;

      connection = await conectar_BD_GAF_MySql();


      const [result] = await connection.execute(
        'SELECT sp_updatepartidas(?,?,?,?,?,?,?,?,?,?,?)',
        [partidaId, seccion, sector, principal, parcial, subparcial, descripcion, partidapadre_id, gasto, credito,creditoanteproyecto]
      );
      //  await connection.end();
      if (result[0]['sp_updatepartidas(?,?,?,?,?,?,?,?,?,?,?)'] === 0) {
        res
          .status(400)
          .json({
            message: "Una partida ya existente con ese código",
            Item: result[0].partida_det,
          });
      }


      else {

        res.status(200).json({ message: "Partida modificada con éxito" })
      }
    } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    } finally {
      // Cerrar la conexión a la base de datos
      if (connection) {
        await connection.end();
      }
    }
  }

const borrarPartida = async (req, res) => {
  const{ id }= req.body;

  const sql = "DELETE FROM partidas WHERE partida_id = ?";
  const values = [id];
  let connection;
  try {
     connection = await conectar_BD_GAF_MySql();
    const [result] = await connection.execute(sql, values); 
    // await connection.end();
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Partida eliminada con éxito"});
    } else {
      res.status(400).json({ message: "Partida no encontrada"});
    }
  } catch (error) {
    console.error("Error al eliminar la partida:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const listarTiposDeMovimientos =async(req,res)=>{
  let connection;
  try {
  
       connection = await conectar_BD_GAF_MySql();

      const [tiposDeMovimientos] = await connection.execute(
          'SELECT * FROM tipomovimiento'
      ); 
      // await connection.end();
      res.status(200).json({tiposDeMovimientos})
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
}

const listarOrganismos =async(req,res)=>{
  let connection;
  try {
  
       connection = await conectar_BD_GAF_MySql();

      const [organismos] = await connection.execute(
          'SELECT * FROM organismo'
      ); 
      // await connection.end();
      res.status(200).json({organismos})
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
}

const agregarExpediente = async (req, res) => {
  let connection;
  try {
    const { anio, numero, causante, asunto, fecha, organismo_id } = req.body;
    
     connection = await conectar_BD_GAF_MySql();

    const [expediente] = await connection.execute(
      "SELECT * FROM expediente WHERE expediente_numero = ?",
      [numero]
    );

    if (expediente.length > 0) {
      res.status(400).json({
        message: "expediente ya existente",
        expediente: expediente[0].expediente_numero,
      });
    } else {
      const [result] = await connection.execute(
        "INSERT INTO expediente (organismo_id,expediente_numero,expediente_anio,expediente_causante,expediente_asunto, expediente_fecha) VALUES (?,?,?,?,?,?)",
        [organismo_id, numero, anio, causante, asunto, fecha]
      );
//  await connection.end();
      res
        .status(200)
        .json({
          message: "expediente creado con éxito",
          id: result.insertId,
          numero: numero,
          causante: causante,
          asunto: asunto,
          organismo_id: organismo_id
        });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const obtenerDetPresupuestoPorItemYpartida = async (req,res) =>{
  let connection;
  try {
    const item = req.query.item;
    const partida = req.query.partida;
   connection = await conectar_BD_GAF_MySql();


    const [detPresupuesto] = await connection.execute(
        "SELECT dm.detmovimiento_id, dp.detpresupuesto_id FROM detmovimiento dm JOIN detpresupuesto dp ON dm.detpresupuesto_id = dp.detpresupuesto_id  WHERE dp.item_id = ? AND dp.partida_id = ?",
        [item,partida]
      );

//  await connection.end();
      res.status(200).json({detPresupuesto})
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
}

const editarDetalleMovimiento = async (req,res) =>{
  let connection;
  try {
     connection = await conectar_BD_GAF_MySql();

    const {detmovimiento_id,item,partida,importe} = req.body;

    const [detPresupuesto] = await connection.execute(
      "SELECT dm.detmovimiento_id, dp.detpresupuesto_id FROM detmovimiento dm JOIN detpresupuesto dp ON dm.detpresupuesto_id = dp.detpresupuesto_id  WHERE dp.item_id = ? AND dp.partida_id = ?",
      [item,partida]
    );

    if(detPresupuesto.length > 0){
      const [detPresupuesto] = await connection.query(
        "UPDATE detmovimiento dm JOIN detpresupuesto dp ON dm.detpresupuesto_id = dp.detpresupuesto_id SET dm.detmovimiento_importe = ?, dp.partida_id = ? WHERE dm.detmovimiento_id = ?",
        [importe,partida,detmovimiento_id])

        // await connection.end();
        return res.status(200).json({detPresupuesto})
    }

    // await connection.end();
    return res.status(200).json({detPresupuesto})
    
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
}

const listarPartidasCONCAT = async (req, res) => {
  let connection;
  try {
     connection = await conectar_BD_GAF_MySql();
    let sqlQuery = `SELECT partida_id, CONCAT(partida_codigo, ' - ', partida_det) AS partida_concatenada FROM partidas ORDER BY partida_codigo`;

    const [partidas] = await connection.execute(sqlQuery);
//  await connection.end();
    res.status(200).json({ partidas });

  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
}

const partidaExistente = async (req, res) => {
  let connection;
  try {
     connection = await conectar_BD_GAF_MySql();
    const{id}=req.body
    let sqlQuery = `SELECT COUNT(detpresupuesto_id) FROM detpresupuesto WHERE partida_id=?`;
    let value=[id]
    const [result] = await connection.execute(sqlQuery,value);
    console.log(result);
    if (result[0]["COUNT(detpresupuesto_id)"]===1) {
      res.status(200).json({ message: "No se puede editar ni eliminar esta partida",ok:false});
    } else {
      res.status(200).json({ message: "Esta partida se puede editar y eliminar",ok:true});
    }
    // await connection.end();
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
}

const agregarMovimiento = async (req, res) => {
  let transaction;
  try {
    const { movimiento, detMovimiento,expediente, presupuesto } = req.body;

    transaction = await sequelize.transaction();

    let expedienteObj = {
      expediente_anio:expediente.anio,
      expediente_fecha:expediente.fecha,
      expediente_asunto:expediente.asunto,
      expediente_causante:expediente.causante,
      expediente_numero: expediente.numero,
      expediente_detalle: expediente.detalle,
      item_id:expediente.item
    }
    const nuevoExpediente = await Expediente.create(expedienteObj,{
      transaction
    });

    const movimientoObj = {
      movimiento_fecha: movimiento.fecha,
      expediente_id: nuevoExpediente.expediente_id,
      tipomovimiento_id: movimiento.tipomovimiento_id,
      tipoinstrumento_id: expediente.tipoDeInstrumento,
      instrumento_nro: expediente.numeroInstrumento,
      presupuesto_id: presupuesto
    };

    const nuevoMovimiento = await Movimiento.create(movimientoObj, {
      transaction,
    });

    // const movimientoId = result.insertId;
    const movimientoId = nuevoMovimiento.movimiento_id;

    for (const detalle of detMovimiento) {
      await DetMovimiento.create(
        {
          movimiento_id: movimientoId,
          detpresupuesto_id: detalle.detPresupuesto_id,
          detmovimiento_importe: detalle.importe,
        },
        { transaction }
      );
    }
    await transaction.commit();

    res.status(200).json({ message: "Movimiento creado con éxito" });
  } catch (error) {
 
    if(error.name == "SequelizeUniqueConstraintError"){
      res.status(500).json({ message: "El número de expediente ingresado ya existe"});
    }else{

      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
  }
};

const agregarMovimientoDefinitivaPreventiva = async (req, res) => {
  let transaction;
  try {
    const { movimiento, detMovimiento,expediente, presupuesto } = req.body;

    transaction = await sequelize.transaction();

    const movimientoObj = {
      movimiento_fecha: movimiento.fecha,
      expediente_id: expediente.id,
      tipomovimiento_id: movimiento.tipomovimiento_id,
      movimiento_id2: movimiento.id,
      presupuesto_id: presupuesto,
      tipoinstrumento_id: expediente.tipoDeInstrumento,
      instrumento_nro: expediente.numeroInstrumento,
    };

    const nuevoMovimiento = await Movimiento.create(movimientoObj, {
      transaction,
    });

    // const movimientoId = result.insertId;
    const movimientoId = nuevoMovimiento.movimiento_id;

    for (const detalle of detMovimiento) {
      await DetMovimiento.create(
        {
          movimiento_id: movimientoId,
          detpresupuesto_id: detalle.detPresupuesto_id,
          detmovimiento_importe: detalle.importe,
        },
        { transaction }
      );
    }
    await transaction.commit();

    res.status(200).json({ message: "Movimiento creado con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const obtenerPresupuestosParaMovimientoPresupuestario = async (req, res) => {
  let connection;
  try {

    connection = await conectar_BD_GAF_MySql();

    let sqlQuery = `SELECT * FROM presupuesto WHERE presupuesto.presupuesto_fechaaprobado IS NOT NULL AND presupuesto.presupuesto_finalizado IS NULL`;
    const [presupuestos] = await connection.execute(sqlQuery);
    res.status(200).json({ presupuestos });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
}


const modificarMovimiento = async (req, res) => {
  const {  movimiento, detMovimiento } = req.body;

  let connection;
  try {
     connection = await conectar_BD_GAF_MySql();
    await connection.beginTransaction();
      // Paso 1: Eliminar los detalles de movimiento existentes para el movimiento
      await connection.query('DELETE FROM detmovimiento WHERE detmovimiento.movimiento_id = ?', [movimiento.id]);

      // Paso 2: Insertar los nuevos detalles de movimiento
      const insertPromises = detMovimiento.map(detalle => {
          return connection.query('INSERT INTO detmovimiento (movimiento_id, detpresupuesto_id, detmovimiento_importe) VALUES (?, ?, ?)', 
          [movimiento.id,detalle.detPresupuesto_id,detalle.importe]);
      });

      await Promise.all(insertPromises);

      await connection.commit();
      res.status(200).json({ message: 'Movimiento actualizado correctamente' });
  } catch (error) {
    console.log(error);
      await connection.rollback();
      res.status(500).json({ message: 'Error al actualizar los detalles de movimiento', error });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const buscarExpediente = async (req, res) => {
  let connection;
  try {
     connection = await conectar_BD_GAF_MySql();
    const numero = req.query.numero;
    const tipomovimiento_id = req.query.tipomovimiento_id;
    const anio = req.query.anio;

//     const query = `SELECT e.expediente_id,e.item_id,e.expediente_numero,e.expediente_anio,e.expediente_causante,e.expediente_asunto,e.expediente_fecha,e.expediente_detalle , m.presupuesto_id,m.movimiento_id,m.movimiento_fecha,m.tipomovimiento_id,m.movimiento_id2,m.tipoinstrumento_id,m.instrumento_nro,
// ti.tipoinstrumento_det, d.detmovimiento_id,d.detpresupuesto_id,d.detmovimiento_importe,dp.partida_id,dp.presupuesto_anteproyecto,dp.presupuesto_aprobado,dp.presupuesto_credito,dp.presupuesto_ampliaciones,dp.presupuesto_disminuciones,
// i.item_det,i.item_codigo, i.anexo_id, i.finalidad_id, i.funcion_id, i.item_fechainicio,i.item_fechafin,i.organismo_id
// FROM expediente AS e 
// LEFT JOIN movimiento AS m ON e.expediente_id = m.expediente_id 
// LEFT JOIN tipoinstrumento AS ti ON m.tipoinstrumento_id = ti.tipoinstrumento_id LEFT JOIN detmovimiento AS d ON m.movimiento_id = d.movimiento_id 
// LEFT JOIN detpresupuesto AS dp ON d.detpresupuesto_id = dp.detpresupuesto_id 
// LEFT JOIN item AS i ON dp.item_id = i.item_id LEFT JOIN partidas AS pda ON dp.partida_id=pda.partida_id  WHERE e.expediente_numero = ? AND m.tipomovimiento_id = ? AND e.expediente_anio = ?
//     `;

    // Primera consulta: Obtener los detalles del expediente
    const query1 = `
    SELECT e.*, m.presupuesto_id,m.movimiento_id,m.movimiento_fecha,m.tipomovimiento_id,m.movimiento_id2,m.tipoinstrumento_id,m.instrumento_nro, d.detmovimiento_id,d.detpresupuesto_id,d.detmovimiento_importe, dp.partida_id,dp.presupuesto_anteproyecto,dp.presupuesto_aprobado,dp.presupuesto_credito,dp.presupuesto_ampliaciones,dp.presupuesto_disminuciones, i.item_det,i.item_codigo, i.anexo_id, i.finalidad_id, i.funcion_id, i.item_fechainicio,i.item_fechafin,i.organismo_id
    FROM expediente AS e
    LEFT JOIN movimiento AS m ON e.expediente_id = m.expediente_id
    LEFT JOIN detmovimiento AS d ON m.movimiento_id = d.movimiento_id
    LEFT JOIN detpresupuesto AS dp ON d.detpresupuesto_id = dp.detpresupuesto_id
    LEFT JOIN item AS i ON dp.item_id = i.item_id
    LEFT JOIN partidas AS pda ON dp.partida_id = pda.partida_id
    WHERE e.expediente_numero = ? 
    AND m.tipomovimiento_id = ? 
    AND e.expediente_anio = ? 
`;
    const [result1] = await connection.execute(query1, [numero, tipomovimiento_id == 5 ? 4 : tipomovimiento_id == 4 ? 1 : tipomovimiento_id, anio]);
console.log(result1);
    // Obtener los `movimiento_id` para la segunda consulta
    const movimientoIds = result1.map(row => row.movimiento_id);
    // console.log(movimientoIds);

    if (movimientoIds.length > 0) {
      // Segunda consulta: Obtener los `movimiento_id` a excluir
      const query2 = `
        SELECT definitiva.movimiento_id2 
        FROM movimiento AS definitiva 
        WHERE definitiva.movimiento_id2 IN (${movimientoIds.join(', ')})
    `;
      const [result2] = await connection.execute(query2);

      // Responder al cliente con los resultados de ambas consultas
      const response1 = result1; // Resultado de la primera consulta
      const response2 = result2; // Resultado de la segunda consulta

      // Ejemplo de cómo podrías estructurar la respuesta al cliente
      const response = {
        primeraConsulta: response1,
        segundaConsulta: response2,
      };

      // Enviar la respuesta al cliente
      console.log(response);
      if (response.primeraConsulta.length > 0 && response.segundaConsulta.length > 0 && tipomovimiento_id == 5) {
        throw new Error("Ya tiene preventiva")
      } else if(response.primeraConsulta.length > 0 && response.segundaConsulta.length > 0 && tipomovimiento_id == 4){
        throw new Error("Ya tiene reserva")
      }else if (response.primeraConsulta.length > 0 && response.segundaConsulta.length == 0) {
        res.status(200).json(response.primeraConsulta);
      }

    } else {
      // Si no hay movimientoIds, solo responde con el resultado de la primera consulta

      if (result1.length > 0) {

        const response = {
          primeraConsulta: result1,
          segundaConsulta: [],
        };
        res.status(200).json(response.primeraConsulta);
      } else throw new Error("No existe el expediente")
    }


    // await connection.end();
    // res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};


const buscarExpedienteParaModificarDefinitiva = async (req, res) => {
  let connection;
  try {
    connection = await conectar_BD_GAF_MySql();
    const numero = req.query.numero;
    const tipomovimiento_id = req.query.tipomovimiento_id;
    const anio = req.query.anio;


    const query = `SELECT e.expediente_id,e.item_id,e.expediente_numero,e.expediente_anio,e.expediente_causante,e.expediente_asunto,e.expediente_fecha,e.expediente_detalle , m.presupuesto_id,m.movimiento_id,m.movimiento_fecha,m.tipomovimiento_id,m.movimiento_id2,m.tipoinstrumento_id,m.instrumento_nro,
ti.tipoinstrumento_det, d.detmovimiento_id,d.detpresupuesto_id,d.detmovimiento_importe,dp.partida_id,dp.presupuesto_anteproyecto,dp.presupuesto_aprobado,dp.presupuesto_credito,dp.presupuesto_ampliaciones,dp.presupuesto_disminuciones,
i.item_det,i.item_codigo, i.anexo_id, i.finalidad_id, i.funcion_id, i.item_fechainicio,i.item_fechafin,i.organismo_id
FROM expediente AS e LEFT JOIN movimiento AS m ON e.expediente_id = m.expediente_id 
LEFT JOIN tipoinstrumento AS ti ON m.tipoinstrumento_id = ti.tipoinstrumento_id LEFT JOIN detmovimiento AS d ON m.movimiento_id = d.movimiento_id 
LEFT JOIN detpresupuesto AS dp ON d.detpresupuesto_id = dp.detpresupuesto_id 
LEFT JOIN item AS i ON dp.item_id = i.item_id LEFT JOIN partidas AS pda ON dp.partida_id=pda.partida_id  WHERE e.expediente_numero = ? AND m.tipomovimiento_id = ? AND e.expediente_anio = ?
    `;
    const [result] = await connection.execute(query, [numero, tipomovimiento_id, anio]);

    console.log(result);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
}

const listarEjercicio= async (req, res) => {
  let connection;
  try {
    connection = await conectar_BD_GAF_MySql();
    console.log(connection)
    let sqlQuery = `SELECT *  FROM presupuesto`;

    const [ejercicio] = await connection.execute(sqlQuery);
//  await connection.end();
    res.status(200).json({ ejercicio });

  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
}

const listarAnteproyecto= async (req, res) => {
  const item=req.query.item;
  const ejercicio=req.query.ejercicio;
  let connection;
  try {
     connection = await conectar_BD_GAF_MySql();
    let sqlQuery = `SELECT a.detpresupuesto_id,a.partida_id,b.partida_credito,b.partida_creditoanteproyecto,b.partida_codigo,b.partida_det,a.presupuesto_credito,a.presupuesto_anteproyecto,a.presupuesto_aprobado
    FROM detpresupuesto a inner JOIN partidas b
    ON a.partida_id=b.partida_id WHERE a.presupuesto_id=? AND a.item_id=?
    order by b.partida_codigo`;

    const [anteproyecto] = await connection.execute(sqlQuery, [ejercicio, item]);
//  await connection.end();
    res.status(200).json({ anteproyecto });

  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
}

const actualizarPresupuestoAnteproyecto=async(req, res)=> {
  let connection;
  try {
    const { detpresupuesto_id, presupuesto_anteproyecto } = req.body;

    // Crear una conexión a la base de datos
     connection = await conectar_BD_GAF_MySql();

    // Iterar sobre cada elemento a actualizar
   
      

      // Consulta SQL para actualizar el presupuesto_anteproyecto
      const sqlQuery = 'UPDATE detpresupuesto SET presupuesto_anteproyecto = ? WHERE detpresupuesto_id = ?';

      // Ejecutar la consulta SQL con los parámetros proporcionados
      const [result] = await connection.execute(sqlQuery, [presupuesto_anteproyecto, detpresupuesto_id]);

      // Verificar si se realizó la actualización correctamente
      if (result.affectedRows === 1) {
        console.log(`Se actualizó correctamente el presupuesto_anteproyecto para el detpresupuesto_id ${detpresupuesto_id}.`);
        res.status(200).send({mge:'Anteproyecto actualizado',ok:true});
      } 
     else if (result.affectedRows > 1) {
    
        res.status(404).send({mge:`problema en la base de datos . Hay mas de una fila con el mismo id`,ok:false});
      }else {
        res.status(404).send({mge:`No se encontró ningún registro con el detpresupuesto_id ${detpresupuesto_id}.`,ok:false});
      }
    

    // Cerrar la conexión a la base de datos
    // await connection.end();

    
  } catch (error) {
    console.error('Error al actualizar el presupuesto_anteproyecto:', error);
    res.status(500).send('Error en el servidor');
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
}


const actualizarCredito=async(req, res)=> {
  let connection;
  try {
    const { detpresupuesto_id, presupuesto_credito }= req.body;

    // Crear una conexión a la base de datos
    const connection = await conectar_BD_GAF_MySql();

    // Iterar sobre cada elemento a actualizar
 
      

      // Consulta SQL para actualizar el presupuesto_anteproyecto
      const sqlQuery = 'UPDATE detpresupuesto SET presupuesto_credito = ? WHERE detpresupuesto_id = ?';

      // Ejecutar la consulta SQL con los parámetros proporcionados
      const [result] = await connection.execute(sqlQuery, [presupuesto_credito, detpresupuesto_id]);

      // Verificar si se realizó la actualización correctamente
      if (result.affectedRows === 1) {
        console.log(`Se actualizó correctamente el presupuesto_credito para el detpresupuesto_id ${detpresupuesto_id}.`);
      } else {
        res.status(200).send({mge:`No se encontró ningún registro con el detpresupuesto_id ${detpresupuesto_id}.`,ok:false});
      }
    

    // Cerrar la conexión a la base de datos
    await connection.end();

    res.status(200).send({mge:'Credito actualizado',ok:true});
  } catch (error) {
    console.error('Error al actualizar el presupuesto_anteproyecto:', error);
    res.status(500).send('Error en el servidor');
  }
}

const actualizarCreditoCompleto=async(req, res)=> {
  try {
    const datosActualizar = req.body;

    // Crear una conexión a la base de datos
     connection = await conectar_BD_GAF_MySql();

    // Iterar sobre cada elemento a actualizar
    for (const elemento of datosActualizar) {
      const { detpresupuesto_id, presupuesto_credito } = elemento;

      // Consulta SQL para actualizar el presupuesto_anteproyecto
      const sqlQuery = 'UPDATE detpresupuesto SET presupuesto_credito = ? WHERE detpresupuesto_id = ?';

      // Ejecutar la consulta SQL con los parámetros proporcionados
      const [result] = await connection.execute(sqlQuery, [presupuesto_credito, detpresupuesto_id]);

      // Verificar si se realizó la actualización correctamente
      if (result.affectedRows === 1) {
        console.log(`Se actualizó correctamente el presupuesto_credito para el detpresupuesto_id ${detpresupuesto_id}.`);
      } else {
        res.status(200).send({mge:`No se encontró ningún registro con el detpresupuesto_id ${detpresupuesto_id}.`,ok:false});
      }
    }

    // Cerrar la conexión a la base de datos
    // await connection.end();

    res.status(200).send({mge:'Credito actualizado',ok:true});
  } catch (error) {
    console.error('Error al actualizar el presupuesto_anteproyecto:', error);
    res.status(500).send('Error en el servidor');
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
}


const actualizarPresupuestoAprobado=async(req, res)=> {
  let connection;
  try {
    const { detpresupuesto_id, presupuesto_aprobado }  = req.body;

    // Crear una conexión a la base de datos
    const connection = await conectar_BD_GAF_MySql();

    // Iterar sobre cada elemento a actualizar
     
     

      // Consulta SQL para actualizar el presupuesto_anteproyecto
      const sqlQuery = 'UPDATE detpresupuesto SET presupuesto_aprobado = ? WHERE detpresupuesto_id = ?';

      // Ejecutar la consulta SQL con los parámetros proporcionados
      const [result] = await connection.execute(sqlQuery, [presupuesto_aprobado, detpresupuesto_id]);

      // Verificar si se realizó la actualización correctamente
      if (result.affectedRows === 1) {
        console.log(`Se actualizó correctamente el presupuesto_aprobado para el detpresupuesto_id ${detpresupuesto_id}.`);
      } else {
        res.status(200).send({mge:`No se encontró ningún registro con el detpresupuesto_id ${detpresupuesto_id}.`,ok:false});
      }
    

    // Cerrar la conexión a la base de datos
    await connection.end();

    res.status(200).send({mge:'Presupuesto aprobado actualizado',ok:true});
  } catch (error) {
    console.error('Error al actualizar el presupuesto_anteproyecto:', error);
    res.status(500).send('Error en el servidor');
  }
}

const actualizarPresupuestoAprobadoCompleto=async(req, res)=> {
  try {
    const datosActualizar = req.body;

    // Crear una conexión a la base de datos
     connection = await conectar_BD_GAF_MySql();

    // Iterar sobre cada elemento a actualizar
    for (const elemento of datosActualizar) {
      const { detpresupuesto_id, presupuesto_aprobado } = elemento;

      // Consulta SQL para actualizar el presupuesto_anteproyecto
      const sqlQuery = 'UPDATE detpresupuesto SET presupuesto_aprobado = ? WHERE detpresupuesto_id = ?';

      // Ejecutar la consulta SQL con los parámetros proporcionados
      const [result] = await connection.execute(sqlQuery, [presupuesto_aprobado, detpresupuesto_id]);

      // Verificar si se realizó la actualización correctamente
      if (result.affectedRows === 1) {
        console.log(`Se actualizó correctamente el presupuesto_aprobado para el detpresupuesto_id ${detpresupuesto_id}.`);
      } else {
        res.status(200).send({mge:`No se encontró ningún registro con el detpresupuesto_id ${detpresupuesto_id}.`,ok:false});
      }
    }

    // Cerrar la conexión a la base de datos
    // await connection.end();

    res.status(200).send({mge:'Presupuesto aprobado actualizado',ok:true});
  } catch (error) {
    console.error('Error al actualizar el presupuesto_anteproyecto:', error);
    res.status(500).send('Error en el servidor');
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
}

const obtenerPartidasPorItemYMovimiento = async (req,res)=>{
  let connection;
  try {
    const itemId = req.query.item;
    const tipomovimiento_id = req.query.tipomovimiento_id
    const presupuesto = req.query.presupuesto;

    connection = await conectar_BD_GAF_MySql();
    let sqlQuery = `CALL sp_partidas(?,?,?)`;
    const [results, fields] = await connection.execute(sqlQuery, [presupuesto,tipomovimiento_id, itemId]);

    // await connection.end();

    res.status(200).send({mge:'partidas:',results});

  } catch (error) {
    console.log(error);
    res.status(500).send('Error en el servidor');
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
}

const obtenerSaldoPorDetPresupuestoID = async (req,res)=>{
  let connection;
  try {
    const detPresupuestoId = req.query.detPresupuestoId;

    connection = await conectar_BD_GAF_MySql();
    let sqlQuery = `SELECT sp_saldopartida(?)`;
    const [results, fields] = await connection.execute(sqlQuery, [detPresupuestoId]);
    // console.log(results[0]['sp_saldopartida(?)']);
    const saldo = results[0]['sp_saldopartida(?)'];
    res.status(200).send({mge:'saldo:',saldo});

  } catch (error) {
    console.log(error);
    res.status(500).send('Error en el servidor');
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
}


const acumular = async (req, res) => {
  let connection;
  try {
    const {campo, partida, item ,presupuesto_id} = req.body;

    // Verificar que partida e item están definidos
    if (!partida || !item) {
      return res.status(400).send({ mge: 'Datos inválidos', ok: false });
    }

    // Crear una conexión a la base de datos
     connection = await conectar_BD_GAF_MySql();

    // Consulta SQL para actualizar el presupuesto_anteproyecto
    const sqlQuery = "CALL sp_actualizaacumuladores(?,?, ?,?)";

    // Ejecutar la consulta SQL con los parámetros proporcionados
    const result = await connection.execute(sqlQuery, [campo,item, partida,presupuesto_id]);

    // Verificar si se realizó la actualización correctamente
    if (result)
     {
      console.log(`Se actualizó correctamente el presupuesto`);
      // await connection.end(); // Cerrar la conexión a la base de datos
      return res.status(200).send({ mge: 'Presupuesto actualizado', ok: true });
    }
     else {
      // await connection.end(); // Cerrar la conexión a la base de datos
      return res.status(200).send({ mge: 'Error en la actualización', ok: false });
    }
  } catch (error) {
    console.error('Error al actualizar el presupuesto_anteproyecto:', error);
    return res.status(500).send('Error en el servidor');
  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const obtenerPerfilPorCuil = async (req, res) => {
  const { cuil } = req.params;
  const connection = await conectar_BD_GAF_MySql();

  try {
      // Obtener el perfil_id correspondiente al cuil
      const [usuarios] = await connection.execute(
          'SELECT perfil_id FROM usuarios WHERE cuil = ?',
          [cuil]
      );

      if (usuarios.length === 0) {
          return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const perfilId = usuarios[0].perfil_id;

      // Obtener la fila completa del perfil correspondiente al perfil_id
      const [perfiles] = await connection.execute(
          'SELECT * FROM perfiles WHERE perfil_id = ?',
          [perfilId]
      );

      if (perfiles.length === 0) {
          return res.status(404).json({ message: 'Perfil no encontrado' });
      }

      res.status(200).json(perfiles[0]);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message || 'Algo salió mal :(' });
  } finally {
      await connection.end();
  }
};

const obtenerTiposDeInstrumentos = async (req,res) =>{
  let connection;
  try {
    connection = await conectar_BD_GAF_MySql();

    let sqlQuery = `SELECT *  FROM tipoinstrumento`;
    const [tiposDeInstrumentos] = await connection.execute(sqlQuery);

    res.status(200).json({ tiposDeInstrumentos });

  } catch (error) {

    res.status(500).json({ message: error.message || "Algo salió mal :(" });

  }finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
}

module.exports={listarAnexos, agregarAnexo, editarAnexo, borrarAnexo, listarFinalidades, agregarFinalidad, editarFinalidad, borrarFinalidad, listarFunciones, agregarFuncion, editarFuncion, borrarFuncion, listarItems, agregarItem, editarItem, borrarItem, listarPartidas,listarPartidasConCodigo, agregarPartida, editarPartida, borrarPartida,
  agregarEjercicio,editarEjercicio,borrarEjercicio, listarTiposDeMovimientos, listarOrganismos, agregarExpediente,buscarExpediente,
  obtenerDetPresupuestoPorItemYpartida,agregarMovimiento,listarPartidasCONCAT,partidaExistente,listarEjercicio,listarAnteproyecto,actualizarPresupuestoAnteproyecto,actualizarCredito,actualizarPresupuestoAprobado, modificarMovimiento,obtenerPartidasPorItemYMovimiento, editarDetalleMovimiento,acumular,buscarExpedienteParaModificarDefinitiva, agregarMovimientoDefinitivaPreventiva, obtenerPresupuestosParaMovimientoPresupuestario,obtenerPerfilPorCuil,actualizarCreditoCompleto,actualizarPresupuestoAprobadoCompleto,listarItemsFiltrado, obtenerTiposDeInstrumentos,obtenerSaldoPorDetPresupuestoID}





