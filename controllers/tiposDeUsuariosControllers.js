const { conectarBDEstadisticasMySql } = require("../config/dbEstadisticasMYSQL");


const agregarTipoDeUsuario = async (req,res) =>{
    try {
        const {rol} = req.body;
        const connection = await conectarBDEstadisticasMySql();

        const [tipoDeUsuario] = await connection.execute(
            'SELECT * FROM tipoDeUsuario WHERE rol = ?',
            [rol]
        );
        if (tipoDeUsuario.length == 0) {

            const [result] = await connection.execute(
                'INSERT INTO tipoDeUsuario (rol) VALUES (?)',
                [rol]
            );

            await connection.end();

            res.status(200).json({ message: "Tipo De usuario creado con éxito", insertedId: result.insertId });
        } else {
            res.status(400).json({ message: "Tipo De usuario ya existente", rol: tipoDeUsuario[0].rol });
        }
    } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
}

const obtenerRoles =async(req,res)=>{
    try {
    
        const connection = await conectarBDEstadisticasMySql();

        const [roles] = await connection.execute(
            'SELECT * FROM tipoDeUsuario'
        );
        res.status(200).json({roles})
    } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
}

const editarRol = async (req,res) =>{
    try {
        const { nombreRol } = req.body;
        const rolId = req.params.id;
    
        const sql =
          "UPDATE tipoDeUsuario SET rol = ? WHERE id = ?";
        const values = [nombreRol, rolId];
    
        const connection = await conectarBDEstadisticasMySql();
        const [tipoDeUsuario] = await connection.execute(
          "SELECT * FROM tipoDeUsuario WHERE rol = ?",
          [nombreRol]
        );
     
        if (tipoDeUsuario.length == 0 || tipoDeUsuario[0].id == rolId) {
          const [result] = await connection.execute(sql, values);
          // El resultado puede contener información sobre la cantidad de filas afectadas, etc.
          console.log("Filas actualizadas:", result.affectedRows);
          res
            .status(200)
            .json({ message: "tipo de usuario modificado con exito", nombreRol });
        } else {
          res
            .status(400)
            .json({
              message: "rol ya existente",
              Rol: tipoDeUsuario[0].rol,
            });
        }
      } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
      }
}

const borrarRol = async (req, res) => {
    const { id } = req.body;
  
    const sql = "DELETE FROM tipoDeUsuario WHERE id = ?";
    const values = [id];
  
    try {
      const connection = await conectarBDEstadisticasMySql();
      const [result] = await connection.execute(sql, values);
      if (result.affectedRows > 0) {
        res.status(200).json({ message: "Rol eliminado con éxito"});
      } else {
        res.status(400).json({ message: "Rol no encontrado"});
      }
    } catch (error) {
      console.error("Error al eliminar el rol:", error);
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
  };

module.exports={agregarTipoDeUsuario,obtenerRoles,editarRol,borrarRol}