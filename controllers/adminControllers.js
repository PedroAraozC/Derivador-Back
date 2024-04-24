const { conectarBDEstadisticasMySql } = require("../config/dbEstadisticasMYSQL");


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
  const sql = "DELETE FROM opcion WHERE id_opcion = ?";
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



module.exports={ agregarOpcion, borrarOpcion}