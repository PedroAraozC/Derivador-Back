const { conectar_BD_GAF_MySql } = require("../config/dbEstadisticasMYSQL");

// const listarAnexos =async(req,res)=>{
//     try {
    
//         const connection = await conectar_BD_GAF_MySql();

//         const [anexos] = await connection.execute(
//             'SELECT * FROM anexo'
//         );
//         res.status(200).json({anexos})
//     } catch (error) {
//         res.status(500).json({ message: error.message || "Algo salió mal :(" });
//     }
// }
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
  // finally {
  //   if (connection) {
  //     connection.release();
  //   }
  // }
};

module.exports = {
  listarAnexos,
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

const listarFinalidades =async(req,res)=>{
    try {
    
        const connection = await conectar_BD_GAF_MySql();

        const [finalidades] = await connection.execute(
            'SELECT * FROM finalidad'
        );
        res.status(200).json({finalidades})
    } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
}

const agregarFinalidad =async(req,res)=>{
    try {
        const { descripcion} = req.body;
        const connection = await conectar_BD_GAF_MySql();

        const [finalidad] = await connection.execute(
            "SELECT * FROM finalidad WHERE finalidad_det = ?",
            [descripcion]
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
                    'INSERT INTO finalidad (finalidad_det) VALUES (?)',[descripcion]
                );
                res.status(200).json({ message: "finalidad creada con éxito" })
            }
    } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
}

const editarFinalidad = async (req,res) =>{
    try {
        const { descripcion } = req.body;
        const finalidadId = req.params.id;
    
        const sql =
          "UPDATE finalidad SET finalidad_det = ? WHERE finalidad_id = ?";
        const values = [descripcion, finalidadId];
    
        const connection = await conectar_BD_GAF_MySql();
        const [finalidad] = await connection.execute(
          "SELECT * FROM finalidad WHERE finalidad_det = ? ",
          [descripcion]
        );
  
        if (finalidad.length == 0 || finalidad[0].finalidad_id == finalidadId) {
          const [result] = await connection.execute(sql, values);
          // El resultado puede contener información sobre la cantidad de filas afectadas, etc.
          console.log("Filas actualizadas:", result.affectedRows);
          res
            .status(200)
            .json({ message: "finalidad modificada con exito", result });
        } else {
          res
            .status(400)
            .json({
              message: "finalidad ya existente",
              finalidad: finalidad[0].finalidad_det,
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

const listarFunciones =async(req,res)=>{
  try {
  
      const connection = await conectar_BD_GAF_MySql();

      const [funciones] = await connection.execute(
          'SELECT * FROM funcion'
      );
      res.status(200).json({funciones})
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const agregarFuncion =async(req,res)=>{
  try {
      const { descripcion} = req.body;
      const connection = await conectar_BD_GAF_MySql();

      const [funcion] = await connection.execute(
          "SELECT * FROM funcion WHERE funcion_det = ?",
          [descripcion]
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
                  'INSERT INTO funcion (funcion_det) VALUES (?)',[descripcion]
              );
              res.status(200).json({ message: "funcion creada con éxito" })
          }
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const editarFuncion = async (req,res) =>{
  try {
      const { descripcion } = req.body;
      const funcionId = req.params.id;
  
      const sql =
        "UPDATE funcion SET funcion_det = ? WHERE funcion_id = ?";
      const values = [descripcion, funcionId];
  
      const connection = await conectar_BD_GAF_MySql();
      const [funcion] = await connection.execute(
        "SELECT * FROM funcion WHERE funcion_det = ? ",
        [descripcion]
      );

      if (funcion.length == 0 || funcion[0].funcion_id == funcionId) {
        const [result] = await connection.execute(sql, values);
        // El resultado puede contener información sobre la cantidad de filas afectadas, etc.
        console.log("Filas actualizadas:", result.affectedRows);
        res
          .status(200)
          .json({ message: "funcion modificada con exito", result });
      } else {
        res
          .status(400)
          .json({
            message: "funcion ya existente",
            funcion: funcion[0].funcion_det,
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

const listarItems =async(req,res)=>{
  try {
  
      const connection = await conectar_BD_GAF_MySql();

      const [items] = await connection.execute(
          'SELECT * FROM item'
      );
      res.status(200).json({items})
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const agregarItem =async(req,res)=>{
  try {
      const {codigo, descripcion} = req.body;
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
                  'INSERT INTO item (item_codigo,item_det) VALUES (?,?)',[codigo, descripcion]
              );
              res.status(200).json({ message: "Item creado con éxito" })
          }
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const editarItem = async (req,res) =>{
  try {
      const { codigo, descripcion } = req.body;
      const itemId = req.params.id;
  
      const sql =
        "UPDATE item SET item_codigo = ?, item_det = ? WHERE item_id = ?";
      const values = [codigo, descripcion, itemId];
  
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
  try {
  
      const connection = await conectar_BD_GAF_MySql();

      const [partidas] = await connection.execute(
          'SELECT * FROM partidas'
      );
      res.status(200).json({partidas})
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const agregarPartida =async(req,res)=>{
  try {
      const {partida_seccion, partida_sector, partida_principal, partida_parcial, partida_subparcial, partida_codigo, partida_det, partidapadre_id, partida_gasto, partida_credito} = req.body;
      const connection = await conectar_BD_GAF_MySql();

      const [partida] = await connection.execute(
          "SELECT * FROM partidas WHERE partida_codigo = ?",
          [partida_codigo]
        );
         
          if(partida.length > 0){
              res
              .status(400)
              .json({
                message: "partida ya existente",
                Item: partida[0].partida_det,
              });
          }else {
              const [result] = await connection.execute(
                  'INSERT INTO partidas (partida_seccion, partida_sector, partida_principal, partida_parcial, partida_subparcial, partida_codigo, partida_det, partidapadre_id, partida_gasto, partida_credito) VALUES (?,?,?,?,?,?,?,?,?,?)',[partida_seccion, partida_sector, partida_principal, partida_parcial, partida_subparcial, partida_codigo, partida_det, partidapadre_id, partida_gasto, partida_credito]
              );
              res.status(200).json({ message: "Partida creada con éxito" })
          }
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}

const editarPartida = async (req,res) =>{
  try {
      const {partida_seccion, partida_sector, partida_principal, partida_parcial, partida_subparcial, partida_codigo, partida_det, partidapadre_id, partida_gasto, partida_credito} = req.body;
      const partidaId = req.params.id;
  
      const sql =
        "UPDATE partidas SET partida_seccion=?, partida_sector=?, partida_principal=?, partida_parcial=?, partida_subparcial=?, partida_codigo=?, partida_det=?, partidapadre_id=?, partida_gasto=?, partida_credito=? WHERE partida_id = ?";
      const values = [partida_seccion, partida_sector, partida_principal, partida_parcial, partida_subparcial, partida_codigo, partida_det, partidapadre_id, partida_gasto, partida_credito,partidaId ];
  
      const connection = await conectar_BD_GAF_MySql();
      const [partida] = await connection.execute(
        "SELECT * FROM partidas WHERE partida_codigo = ? ",
        [partida_codigo]
      );

      if (partida.length == 0 || partida[0].partida_id == partidaId) {
        const [result] = await connection.execute(sql, values);
        // El resultado puede contener información sobre la cantidad de filas afectadas, etc.
        console.log("Filas actualizadas:", result.affectedRows);
        res
          .status(200)
          .json({ message: "partida modificada con exito", result });
      } else {
        res
          .status(400)
          .json({
            message: "partida ya existente",
            Partida: partida[0].partida_det,
          });
      }
    } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
}

const borrarPartida = async (req, res) => {
  const { id } = req.body;

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
    console.error("Error al eliminar el item:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

module.exports={listarAnexos, agregarAnexo, editarAnexo, borrarAnexo, listarFinalidades, agregarFinalidad, editarFinalidad, borrarFinalidad, listarFunciones, agregarFuncion, editarFuncion, borrarFuncion, listarItems, agregarItem, editarItem, borrarItem, listarPartidas, agregarPartida, editarPartida, borrarPartida}