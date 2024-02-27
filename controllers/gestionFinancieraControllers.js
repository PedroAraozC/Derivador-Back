const { conectar_BD_GAF_MySql } = require("../config/dbEstadisticasMYSQL");

const listarAnexos =async(req,res)=>{
    try {
    
        const connection = await conectar_BD_GAF_MySql();

        const [anexos] = await connection.execute(
            'SELECT * FROM anexo'
        );
        res.status(200).json({anexos})
    } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
}

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
                const [anexos] = await connection.execute(
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
                const [finalidades] = await connection.execute(
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

module.exports={listarAnexos, agregarAnexo, editarAnexo, borrarAnexo, listarFinalidades, agregarFinalidad, editarFinalidad, borrarFinalidad}