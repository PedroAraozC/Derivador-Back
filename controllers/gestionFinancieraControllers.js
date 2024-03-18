const { conectar_BD_GAF_MySql } = require("../config/dbEstadisticasMYSQL");

const listarAnexos = async (req, res) => {
  const connection = await conectar_BD_GAF_MySql();
  try {
      // Verifica si hay un término de búsqueda en los parámetros de la solicitud
      const searchTerm = req.query.searchTerm || '';

      let sqlQuery = 'SELECT * FROM anexo';

      // Agrega la cláusula WHERE para la búsqueda si hay un término de búsqueda
      if (searchTerm) {
          // sqlQuery += ' WHERE anexo_codigo LIKE ? OR anexo_det LIKE ?';
          sqlQuery += ' WHERE LOWER(anexo_codigo) LIKE LOWER(?) OR LOWER(anexo_det) LIKE LOWER(?)';
      }

      const [anexos] = await connection.execute(sqlQuery, [`%${searchTerm}%`, `%${searchTerm}%`]);

      res.status(200).json({ anexos });
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const agregarAnexo =async(req,res)=>{
    try {
        const {codigo, descripcion} = req.body;
        const connection = await conectar_BD_GAF_MySql();

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
                res.status(200).json({ message: "Anexo creado con éxito" })
            }
    } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
}

const editarAnexo = async (req,res) =>{
    try {
        const { codigo, descripcion } = req.body;
        const anexoId = req.params.id;
    
        const sql =
          "UPDATE anexo SET anexo_codigo = ?, anexo_det = ? WHERE anexo_id = ?";
        const values = [codigo, descripcion, anexoId];
    
        const connection = await conectar_BD_GAF_MySql();
        const [anexo] = await connection.execute(
          "SELECT * FROM anexo WHERE anexo_codigo = ? ",
          [codigo]
        );
     console.log(anexo);
        if (anexo.length == 0 || anexo[0].anexo_id == anexoId) {
          const [result] = await connection.execute(sql, values);
          // El resultado puede contener información sobre la cantidad de filas afectadas, etc.
          console.log("Filas actualizadas:", result.affectedRows);
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
      }
}

const borrarAnexo = async (req, res) => {
    const { id } = req.body;
  
    const sql = "DELETE FROM anexo WHERE anexo_id = ?";
    const values = [id];
  
    try {
      const connection = await conectar_BD_GAF_MySql();
      const [result] = await connection.execute(sql, values);
      if (result.affectedRows > 0) {
        res.status(200).json({ message: "Anexo eliminado con éxito"});
      } else {
        res.status(400).json({ message: "Anexo no encontrado"});
      }
    } catch (error) {
      console.error("Error al eliminar el rol:", error);
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
  };

const listarEjercicios = async (req, res) => {
  const connection = await conectar_BD_GAF_MySql();
  try {
      // Verifica si hay un término de búsqueda en los parámetros de la solicitud
      const searchTerm = req.query.searchTerm || '';

      let sqlQuery = 'SELECT * FROM ejercicio';

      // Agrega la cláusula WHERE para la búsqueda si hay un término de búsqueda
      if (searchTerm) {
          // sqlQuery += ' WHERE anexo_codigo LIKE ? OR anexo_det LIKE ?';
          sqlQuery += ' WHERE LOWER(ejercicio_anio) LIKE LOWER(?) OR LOWER(ejercicio_det) LIKE LOWER(?)';
      }

      const [ejercicios] = await connection.execute(sqlQuery, [`%${searchTerm}%`, `%${searchTerm}%`]);

      res.status(200).json({ ejercicios });
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const agregarEjercicio =async(req,res)=>{
    try {
        const {anio, descripcion} = req.body;
        const connection = await conectar_BD_GAF_MySql();

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
                res.status(200).json({ message: "Ejercicio creado con éxito" })
            }
    } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
}

const editarEjercicio = async (req,res) =>{
    try {
        const { anio, descripcion } = req.body;
        const ejercicioId = req.params.id;
    
        const sql =
          "UPDATE ejercicio SET ejercicio_anio = ?, ejercicio_det = ? WHERE ejercicio_id = ?";
        const values = [anio, descripcion, ejercicioId];
    
        const connection = await conectar_BD_GAF_MySql();
        const [ejercicio] = await connection.execute(
          "SELECT * FROM ejercicio WHERE (ejercicio_anio,ejercicio_det) = (?,?)",
          [anio,descripcion]
        );
   
        if (ejercicio.length == 0 || ejercicio[0].ejercicio_id == ejercicioId) {
          const [result] = await connection.execute(sql, values);
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
      }
}

const borrarEjercicio = async (req, res) => {
    const { id } = req.body;
  
    const sql = "DELETE FROM ejercicio WHERE ejercicio_id = ?";
    const values = [id];
  
    try {
      const connection = await conectar_BD_GAF_MySql();
      const [result] = await connection.execute(sql, values);
      if (result.affectedRows > 0) {
        res.status(200).json({ message: "Ejercicio eliminado con éxito"});
      } else {
        res.status(400).json({ message: "Ejercicio no encontrado"});
      }
    } catch (error) {
      console.error("Error al eliminar el ejercicio:", error);
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
  };

const listarFinalidades = async (req, res) => {
  const connection = await conectar_BD_GAF_MySql();
  try {
      // Verifica si hay un término de búsqueda en los parámetros de la solicitud
      const searchTerm = req.query.searchTerm || '';

      let sqlQuery = 'SELECT * FROM finalidad';

      // Agrega la cláusula WHERE para la búsqueda si hay un término de búsqueda
      if (searchTerm) {
          // sqlQuery += ' WHERE anexo_codigo LIKE ? OR anexo_det LIKE ?';
          sqlQuery += ' WHERE LOWER(finalidad_codigo) LIKE LOWER(?) OR LOWER(finalidad_det) LIKE LOWER(?)';
      }

      const [finalidades] = await connection.execute(sqlQuery, [`%${searchTerm}%`, `%${searchTerm}%`]);

      res.status(200).json({ finalidades });
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const agregarFinalidad =async(req,res)=>{
    try {
        const { descripcion,codigo} = req.body;
        const connection = await conectar_BD_GAF_MySql();

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
                res.status(200).json({ message: "finalidad creada con éxito" })
            }
    } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
}

const editarFinalidad = async (req,res) =>{
  try {
    const { codigo, descripcion } = req.body;
    const finalidadId = req.params.id;

    const sql =
      "UPDATE finalidad SET finalidad_codigo = ?, finalidad_det = ? WHERE finalidad_id = ?";
    const values = [codigo, descripcion, finalidadId];

    const connection = await conectar_BD_GAF_MySql();
    const [finalidad] = await connection.execute(
      "SELECT * FROM finalidad WHERE finalidad_codigo = ? ",
      [codigo]
    );
 
    if (finalidad.length == 0 || finalidad[0].finalidad_id == finalidadId) {
      const [result] = await connection.execute(sql, values);
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
  }
}

const borrarFinalidad = async (req, res) => {
    const { id } = req.body;
  
    const sql = "DELETE FROM finalidad WHERE finalidad_id = ?";
    const values = [id];
  
    try {
      const connection = await conectar_BD_GAF_MySql();
      const [result] = await connection.execute(sql, values);
      if (result.affectedRows > 0) {
        res.status(200).json({ message: "finalidad eliminada con éxito"});
      } else {
        res.status(400).json({ message: "finalidad no encontrada"});
      }
    } catch (error) {
      console.error("Error al eliminar la finalidad:", error);
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
  };

const listarFunciones = async (req, res) => {
  const connection = await conectar_BD_GAF_MySql();
  try {
      // Verifica si hay un término de búsqueda en los parámetros de la solicitud
      const searchTerm = req.query.searchTerm || '';

      let sqlQuery = 'SELECT funcion.*, finalidad_det FROM funcion LEFT JOIN finalidad ON funcion.finalidad_id = finalidad.finalidad_id';

      // Agrega la cláusula WHERE para la búsqueda si hay un término de búsqueda
      if (searchTerm) {
          
          sqlQuery += ' WHERE LOWER(funcion_codigo) LIKE LOWER(?) OR LOWER(funcion_det) LIKE LOWER(?)';
      }
      const [funciones] = await connection.execute(sqlQuery, [`%${searchTerm}%`, `%${searchTerm}%`]);
      console.log(funciones);

      res.status(200).json({ funciones });
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const agregarFuncion =async(req,res)=>{
  try {
      const { descripcion,codigo,finalidad_id} = req.body;

      const connection = await conectar_BD_GAF_MySql();

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
              res.status(200).json({ message: "funcion creada con éxito" })
          }
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const editarFuncion = async (req,res) =>{
  try {
    const { codigo, descripcion, finalidad_id } = req.body;
    const funcionId = req.params.id;

    const sql =
      "UPDATE funcion SET funcion_codigo = ?, funcion_det = ?, finalidad_id = ? WHERE funcion_id = ?";
    const values = [codigo, descripcion,finalidad_id, funcionId];

    const connection = await conectar_BD_GAF_MySql();
    const [funcion] = await connection.execute(
      "SELECT * FROM funcion WHERE funcion_codigo = ? ",
      [codigo]
    );
 
    if (funcion.length == 0 || funcion[0].funcion_id == funcionId) {
      const [result] = await connection.execute(sql, values);
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
  }
}

const borrarFuncion = async (req, res) => {
  const { id } = req.body;

  const sql = "DELETE FROM funcion WHERE funcion_id = ?";
  const values = [id];

  try {
    const connection = await conectar_BD_GAF_MySql();
    const [result] = await connection.execute(sql, values);
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "funcion eliminada con éxito"});
    } else {
      res.status(400).json({ message: "funcion no encontrada"});
    }
  } catch (error) {
    console.error("Error al eliminar la funcion:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};


const listarItems = async (req, res) => {
  const connection = await conectar_BD_GAF_MySql();
  try {
      // Verifica si hay un término de búsqueda en los parámetros de la solicitud
      const searchTerm = req.query.searchTerm || '';

      let sqlQuery =  'SELECT item.*, anexo_det, finalidad_det, funcion_det FROM item ' +
      'LEFT JOIN anexo ON item.anexo_id = anexo.anexo_id ' +
      'LEFT JOIN finalidad ON item.finalidad_id = finalidad.finalidad_id ' +
      'LEFT JOIN funcion ON item.funcion_id = funcion.funcion_id'

      // Agrega la cláusula WHERE para la búsqueda si hay un término de búsqueda
      if (searchTerm) {
          
          sqlQuery += ' WHERE LOWER(item_codigo) LIKE LOWER(?) OR LOWER(item_det) LIKE LOWER(?)';
      }
      const [items] = await connection.execute(sqlQuery, [`%${searchTerm}%`, `%${searchTerm}%`]);

      res.status(200).json({ items });
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

// const listarItems =async(req,res)=>{
//   try {
  
//       const connection = await conectar_BD_GAF_MySql();

//       const [items] = await connection.execute(
//         'SELECT item.*, anexo_det, finalidad_det, funcion_det FROM item ' +
//         'LEFT JOIN anexo ON item.anexo_id = anexo.anexo_id ' +
//         'LEFT JOIN finalidad ON item.finalidad_id = finalidad.finalidad_id ' +
//         'LEFT JOIN funcion ON item.funcion_id = funcion.funcion_id'
//       );
      
//       res.status(200).json({items})
//   } catch (error) {
//       res.status(500).json({ message: error.message || "Algo salió mal :(" });
//   }
// }

const agregarItem =async(req,res)=>{
  try {
      const {codigo, descripcion,anexo_id,finalidad_id,funcion_id,fechaInicio,fechaFin} = req.body;
      const connection = await conectar_BD_GAF_MySql();

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
                  'INSERT INTO item (item_codigo,item_det,anexo_id,finalidad_id,funcion_id,item_fechainicio,item_fechafin) VALUES (?,?,?,?,?,?,?)',[codigo, descripcion,anexo_id,finalidad_id,funcion_id,fechaInicio,fechaFin]
              );
              res.status(200).json({ message: "Item creado con éxito" })
          }
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const editarItem = async (req,res) =>{
  try {
      const { codigo, descripcion,anexo_id,finalidad_id,funcion_id,fechaInicio,fechaFin } = req.body;
      const itemId = req.params.id;
  
      const sql =
        "UPDATE item SET item_codigo = ?, item_det = ?, anexo_id = ?, finalidad_id = ?, funcion_id = ?, item_fechaInicio = ?, item_fechaFin = ? WHERE item_id = ?";
      const values = [codigo, descripcion,anexo_id,finalidad_id,funcion_id,fechaInicio,fechaFin, itemId];
  
      const connection = await conectar_BD_GAF_MySql();
      const [item] = await connection.execute(
        "SELECT * FROM item WHERE item_codigo = ? ",
        [codigo]
      );

      if (item.length == 0 || item[0].item_id == itemId) {
        const [result] = await connection.execute(sql, values);
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
    }
}

const borrarItem = async (req, res) => {
  const { id } = req.body;

  const sql = "DELETE FROM item WHERE item_id = ?";
  const values = [id];

  try {
    const connection = await conectar_BD_GAF_MySql();
    const [result] = await connection.execute(sql, values);
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Item eliminado con éxito"});
    } else {
      res.status(400).json({ message: "Item no encontrado"});
    }
  } catch (error) {
    console.error("Error al eliminar el item:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const listarPartidas =async(req,res)=>{
  const connection = await conectar_BD_GAF_MySql();
  try {
      // Verifica si hay un término de búsqueda en los parámetros de la solicitud
      const searchTerm = req.query.searchTerm || '';

      let sqlQuery =  'SELECT * FROM partidas'

      // Agrega la cláusula WHERE para la búsqueda si hay un término de búsqueda
      if (searchTerm) {
          
          sqlQuery += ' WHERE LOWER(partida_codigo) LIKE LOWER(?) OR LOWER(partida_det) LIKE LOWER(?)';
      }
      const [partidas] = await connection.execute(sqlQuery, [`%${searchTerm}%`, `%${searchTerm}%`]);

      res.status(200).json({ partidas });
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const agregarPartida =async(req,res)=>{
  try {
      const {id,seccion, sector, principal, parcial, subparcial, codigo, descripcion, partidapadre_id, gasto,credito} = req.body;
      const connection = await conectar_BD_GAF_MySql();
          
          
      const [result] = await connection.execute(
        'SELECT sp_insertpartidas(?,?,?,?,?,?,?,?,?)',
        [seccion, sector, principal, parcial, subparcial, descripcion, partidapadre_id, gasto, credito]
      );
      console.log(result)

              if(result[0]['sp_insertpartidas(?,?,?,?,?,?,?,?,?)'] === 0){
                res
                .status(400)
                .json({
                  message: "partida ya existente",
                  Item: result[0].partida_det,
                });
            }
            

else{

  res.status(200).json({ message: "Partida creada con éxito" })
}

             
          
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const editarPartida = async (req,res) =>{
  try {
    const {id,seccion, sector, principal, parcial, subparcial, codigo, descripcion, partidapadre_id, gasto,credito} = req.body;
      const partidaId = req.params.id;
  
      const connection = await conectar_BD_GAF_MySql();
          
          
      const [result] = await connection.execute(
        'SELECT sp_updatepartidas(?,?,?,?,?,?,?,?,?,?)',
        [partidaId,seccion, sector, principal, parcial, subparcial, descripcion, partidapadre_id, gasto, credito]
      );

      if(result[0]['sp_updatepartidas(?,?,?,?,?,?,?,?,?,?)'] === 0){
        res
        .status(400)
        .json({
          message: "Una partida ya existente con ese código",
          Item: result[0].partida_det,
        });
    }
    

else{

res.status(200).json({ message: "Partida modificada con éxito" })
}
    } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
}

const borrarPartida = async (req, res) => {
  const{ id }= req.body;

  const sql = "DELETE FROM partidas WHERE partida_id = ?";
  const values = [id];

  try {
    const connection = await conectar_BD_GAF_MySql();
    const [result] = await connection.execute(sql, values);
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Partida eliminada con éxito"});
    } else {
      res.status(400).json({ message: "Partida no encontrada"});
    }
  } catch (error) {
    console.error("Error al eliminar la partida:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const listarPartidasCONCAT = async (req, res) => {
  const connection = await conectar_BD_GAF_MySql();
  try {
    let sqlQuery = `SELECT partida_id, CONCAT(partida_codigo, ' - ', partida_det) AS partida_concatenada FROM partidas ORDER BY partida_codigo`;

    const [partidas] = await connection.execute(sqlQuery);

    res.status(200).json({ partidas });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}


module.exports={listarAnexos, agregarAnexo, editarAnexo, borrarAnexo, listarFinalidades, agregarFinalidad, editarFinalidad, borrarFinalidad, listarFunciones, agregarFuncion, editarFuncion, borrarFuncion, listarItems, agregarItem, editarItem, borrarItem, listarPartidas, agregarPartida, editarPartida, borrarPartida, listarEjercicios,
agregarEjercicio,editarEjercicio,borrarEjercicio,listarPartidasCONCAT}