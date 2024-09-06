const { conectar_BD_GED_MySql } = require("../config/dbEstadisticasMYSQL");


////////// REPARTICIONES ////////////////////////////////////////////////////////////



const obtenerReparticionesGED = async (req, res) => {
    let connection;
    try {
      connection = await conectar_BD_GED_MySql(); 
  
      const sqlReparticiones = `
     SELECT reparticion_id,reparticion_codigo,reparticion_det,reparticion_dependencia,(SELECT reparticion_det FROM reparticion b  WHERE b.reparticion_id=a.reparticion_dependencia) dependencia,
reparticion_tipo,if(reparticion_tipo=1,'SECRETARIA',IF(reparticion_tipo=2,'SUBSECRETARIA','DIRECCION')) tipo
FROM reparticion a ORDER BY reparticion_codigo
      `;
      const [reparticiones] = await connection.execute(sqlReparticiones);
  
      if (reparticiones)
      {
        res.status(200).json({ reparticiones });
      }
  
  else {
    res.status(204).json({ mge:"no hay datos" });
  }
      // Enviar los resultados como respuesta
     
    } catch (error) {
      // Manejo de errores detallado
      console.error('Error al obtener los datos:', error);
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    } finally {
      // Cerrar la conexión a la base de datos
      if (connection) {
        await connection.end();
      }
    }
  };

  const agregarReparticionGED = async (req, res) => {
    let connection;
    try {
        // Establecer la conexión a la base de datos
        connection = await conectar_BD_GED_MySql();

        // Obtener los datos de la repartición desde el cuerpo de la solicitud (req.body)
        const { reparticion_det, reparticion_codigo, reparticion_dependencia, reparticion_tipo } = req.body;

        // Validar que los campos requeridos estén presentes
        if (!reparticion_det || !reparticion_codigo || !reparticion_dependencia || !reparticion_tipo) {
            return res.status(400).json({ message: "Faltan datos necesarios para agregar la repartición" });
        }

        // Consulta SQL para insertar una nueva repartición
        const sqlInsertReparticion = `
            INSERT INTO reparticion (reparticion_det, reparticion_codigo, reparticion_dependencia, reparticion_tipo)
            VALUES (?, ?, ?, ?)
        `;

        // Ejecutar la consulta de inserción con los datos proporcionados
        const [result] = await connection.execute(sqlInsertReparticion, [
            reparticion_det.toUpperCase(),
            reparticion_codigo,
            reparticion_dependencia,
            reparticion_tipo,
        ]);

        // Comprobar si se ha insertado correctamente
        if (result.affectedRows > 0) {
            res.status(201).json({ message: "Repartición agregada exitosamente" ,ok:true});
        } else {
            res.status(500).json({ message: "No se pudo agregar la repartición" });
        }
    } catch (error) {
        // Manejo de errores detallado
        console.error('Error al agregar la repartición:', error);
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    } finally {
        // Cerrar la conexión a la base de datos
        if (connection) {
            await connection.end();
        }
    }
};

const editarReparticionGED = async (req, res) => {
    let connection;
    try {
        // Establecer la conexión a la base de datos
        connection = await conectar_BD_GED_MySql();

        // Obtener los datos de la repartición desde el cuerpo de la solicitud
        const { reparticion_id, reparticion_det, reparticion_codigo, reparticion_dependencia, reparticion_tipo } = req.body;

        // Validar que los campos requeridos estén presentes
        if (!reparticion_id || !reparticion_det || !reparticion_codigo || !reparticion_dependencia || !reparticion_tipo) {
            return res.status(400).json({ message: "Faltan datos necesarios para editar la repartición" });
        }

        // Consulta SQL para actualizar la repartición
        const sqlUpdateReparticion = `
            UPDATE reparticion
            SET reparticion_det = ?, reparticion_codigo = ?, reparticion_dependencia = ?, reparticion_tipo = ?
            WHERE reparticion_id = ?
        `;

        // Ejecutar la consulta de actualización con los datos proporcionados
        const [result] = await connection.execute(sqlUpdateReparticion, [
            reparticion_det,
            reparticion_codigo,
            reparticion_dependencia,
            reparticion_tipo,
            reparticion_id
        ]);

        // Comprobar si se ha actualizado correctamente
        if (result.affectedRows > 0) {
            res.status(200).json({ message: "Repartición actualizada exitosamente" ,ok:true});
        } else {
            res.status(404).json({ message: "No se encontró la repartición con el ID proporcionado" ,ok:false});
        }
    } catch (error) {
        // Manejo de errores detallado
        console.error('Error al editar la repartición:', error);
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    } finally {
        // Cerrar la conexión a la base de datos
        if (connection) {
            await connection.end();
        }
    }
};

const eliminarReparticionGED = async (req, res) => {
    let connection;
    try {
        // Establecer la conexión a la base de datos
        connection = await conectar_BD_GED_MySql();

        // Obtener el ID de la repartición desde los parámetros de la solicitud
        const { reparticion_id } = req.params;

        // Validar que se haya proporcionado el ID de la repartición
        if (!reparticion_id) {
            return res.status(400).json({ message: "Debe proporcionar un ID de repartición válido" ,ok:false});
        }

        // Consulta SQL para eliminar la repartición
        const sqlEliminarReparticion = `
            DELETE FROM reparticion
            WHERE reparticion_id = ?
        `;

        // Ejecutar la consulta de eliminación
        const [result] = await connection.execute(sqlEliminarReparticion, [reparticion_id]);

        // Comprobar si se eliminó la repartición
        if (result.affectedRows > 0) {
            res.status(200).json({ message: "Repartición eliminada exitosamente" ,ok:true});
        } else {
            res.status(404).json({ message: "No se encontró la repartición con el ID proporcionado" ,ok:false});
        }
    } catch (error) {
        // Manejo de errores detallado
        console.error('Error al eliminar la repartición:', error);
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    } finally {
        // Cerrar la conexión a la base de datos
        if (connection) {
            await connection.end();
        }
    }
};


/////////////////PROGRAMAS ///////////////////////////////////////////////////////

const obtenerProgramasGED = async (req, res) => {
    let connection;
    try {
      connection = await conectar_BD_GED_MySql(); 
  
      const sqlProgramas = `
SELECT programa_id,programa_codigo,programa_det,programa.reparticion_id,reparticion_det,reparticion_dependencia,
(SELECT reparticion_det FROM reparticion b  WHERE b.reparticion_id=reparticion.reparticion_dependencia) dependencia,
programa_descripcion FROM programa 
INNER JOIN reparticion ON programa.reparticion_id=reparticion.reparticion_id
      `;
      const [programas] = await connection.execute(sqlProgramas);
  
      if (programas)
      {
        res.status(200).json({ programas });
      }
  
  else {
    res.status(204).json({ mge:"no hay datos" });
  }
      // Enviar los resultados como respuesta
     
    } catch (error) {
      // Manejo de errores detallado
      console.error('Error al obtener los datos:', error);
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    } finally {
      // Cerrar la conexión a la base de datos
      if (connection) {
        await connection.end();
      }
    }
  };

const agregarProgramaGED = async (req, res) => {
    let connection;
    try {
        // Establecer la conexión a la base de datos
        connection = await conectar_BD_GED_MySql();

        // Obtener los datos de la repartición desde el cuerpo de la solicitud (req.body)
        const { programa_det, programa_codigo, programa_descripcion, reparticion_id } = req.body;

        // Validar que los campos requeridos estén presentes
        if (!programa_det || !programa_codigo || !programa_descripcion || !reparticion_id) {
            return res.status(400).json({ message: "Faltan datos necesarios para agregar la repartición" });
        }

        // Consulta SQL para insertar
        const sqlInsertReparticion = `
            INSERT INTO programa (programa_det, programa_codigo, programa_descripcion ,  reparticion_id)
            VALUES (?, ?, ?, ?)
        `;

        // Ejecutar la consulta de inserción con los datos proporcionados
        const [result] = await connection.execute(sqlInsertReparticion, [
            programa_det.toUpperCase(),
            programa_codigo,
            programa_descripcion.toUpperCase(),
            reparticion_id,
        ]);

        // Comprobar si se ha insertado correctamente
        if (result.affectedRows > 0) {
            res.status(201).json({ message: "Programa agregado exitosamente" ,ok:true});
        } else {
            res.status(500).json({ message: "No se pudo agregar el programa" });
        }
    } catch (error) {
        // Manejo de errores detallado
        console.error('Error al agregar el programa:', error);
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    } finally {
        // Cerrar la conexión a la base de datos
        if (connection) {
            await connection.end();
        }
    }
};

const editarProgramaGED = async (req, res) => {
    let connection;
    try {
        // Establecer la conexión a la base de datos
        connection = await conectar_BD_GED_MySql();

        // Obtener los datos del programa desde el cuerpo de la solicitud (req.body)
        const { programa_id, programa_det, programa_codigo, programa_descripcion, reparticion_id } = req.body;

        // Validar que los campos requeridos estén presentes
        if (!programa_id || !programa_det || !programa_codigo || !programa_descripcion || !reparticion_id) {
            return res.status(400).json({ message: "Faltan datos necesarios para editar el programa" });
        }

        // Consulta SQL para actualizar
        const sqlUpdatePrograma = `
            UPDATE programa
            SET programa_det = ?, programa_codigo = ?, programa_descripcion = ?, reparticion_id = ?
            WHERE programa_id = ?
        `;

        // Ejecutar la consulta de actualización con los datos proporcionados
        const [result] = await connection.execute(sqlUpdatePrograma, [
            programa_det.toUpperCase(),
            programa_codigo,
            programa_descripcion.toUpperCase(),
            reparticion_id,
            programa_id,
        ]);

        // Comprobar si se ha actualizado correctamente
        if (result.affectedRows > 0) {
            res.status(200).json({ message: "Programa editado exitosamente", ok: true });
        } else {
            res.status(404).json({ message: "No se encontró el programa para editar" });
        }
    } catch (error) {
        // Manejo de errores detallado
        console.error('Error al editar el programa:', error);
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    } finally {
        // Cerrar la conexión a la base de datos
        if (connection) {
            await connection.end();
        }
    }
};

const eliminarProgramaGED = async (req, res) => {
    let connection;
    try {
        // Establecer la conexión a la base de datos
        connection = await conectar_BD_GED_MySql();

        // Obtener el ID del programa desde los parámetros de la solicitud (req.params)
        const { programa_id } = req.params;

        // Validar que el ID esté presente
        if (!programa_id) {
            return res.status(400).json({ message: "Falta el ID del programa para eliminar" });
        }

        // Consulta SQL para eliminar
        const sqlDeletePrograma = `
            DELETE FROM programa WHERE programa_id = ?
        `;

        // Ejecutar la consulta de eliminación con el ID proporcionado
        const [result] = await connection.execute(sqlDeletePrograma, [programa_id]);

        // Comprobar si se ha eliminado correctamente
        if (result.affectedRows > 0) {
            res.status(200).json({ message: "Programa eliminado exitosamente", ok: true });
        } else {
            res.status(404).json({ message: "No se encontró el programa para eliminar" });
        }
    } catch (error) {
        // Manejo de errores detallado
        console.error('Error al eliminar el programa:', error);
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    } finally {
        // Cerrar la conexión a la base de datos
        if (connection) {
            await connection.end();
        }
    }
};


  module.exports ={obtenerReparticionesGED,agregarReparticionGED,editarReparticionGED,eliminarReparticionGED,obtenerProgramasGED,agregarProgramaGED,editarProgramaGED,eliminarProgramaGED}