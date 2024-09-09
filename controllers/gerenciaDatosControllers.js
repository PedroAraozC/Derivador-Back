const { conectar_BD_GED_MySql } = require("../config/dbEstadisticasMYSQL");



const obtenerPerfilPorCuilGED = async (req, res) => {
    const { cuil } = req.params;
    const connection = await conectar_BD_GED_MySql();
  
    try {
        // Obtener el perfil_id correspondiente al cuil
        const [usuarios] = await connection.execute(
            'SELECT perfil_id FROM usuario WHERE usuario_cuil = ?',
            [cuil]
        );
  
        if (usuarios.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
  
        const perfilId = usuarios[0].perfil_id;
  
        // Obtener la fila completa del perfil correspondiente al perfil_id
        const [perfiles] = await connection.execute(
            'SELECT * FROM perfil WHERE perfil_id = ?',
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

  const obtenerReparticionesFiltradasGED = async (req, res) => {
    let connection;
    try {
      connection = await conectar_BD_GED_MySql();
  
      // Obtener el cuil desde los parámetros de la solicitud
      const { cuil } = req.params;
  
      // Consulta SQL para obtener las reparticiones filtradas por el cuil en la tabla permisos
      const sqlReparticionesFiltradas = `
        SELECT a.reparticion_id, a.reparticion_codigo, a.reparticion_det, a.reparticion_dependencia,
        (SELECT reparticion_det FROM reparticion b WHERE b.reparticion_id = a.reparticion_dependencia) AS dependencia,
        a.reparticion_tipo, IF(a.reparticion_tipo = 1, 'SECRETARIA', IF(a.reparticion_tipo = 2, 'SUBSECRETARIA', 'DIRECCION')) AS tipo
        FROM reparticion a
        JOIN permisos p ON a.reparticion_id = p.reparticion_id
        WHERE p.usuario_cuil = ?
        ORDER BY a.reparticion_codigo
      `;
  
      // Ejecutar la consulta con el cuil proporcionado
      const [reparticionesFiltradas] = await connection.execute(sqlReparticionesFiltradas, [cuil]);
  
      if (reparticionesFiltradas.length > 0) {
        res.status(200).json({ reparticiones: reparticionesFiltradas });
      } else {
        res.status(204).json({ message: "No se encontraron reparticiones para este CUIL." });
      }
    } catch (error) {
      // Manejo de errores
      console.error('Error al obtener las reparticiones filtradas:', error);
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

  const obtenerProgramasPorReparticionGED = async (req, res) => {
    let connection;
    try {
      connection = await conectar_BD_GED_MySql();
  
      // Obtener el reparticion_id desde los parámetros de la solicitud
      const { reparticion_id } = req.params;
  
      // Consulta SQL para obtener los programas filtrados por reparticion_id
      const sqlProgramasFiltrados = `
        SELECT programa_id, programa_codigo, programa_det, programa.reparticion_id, reparticion_det,
        reparticion_dependencia, 
        (SELECT reparticion_det FROM reparticion b WHERE b.reparticion_id = reparticion.reparticion_dependencia) AS dependencia,
        programa_descripcion 
        FROM programa 
        INNER JOIN reparticion ON programa.reparticion_id = reparticion.reparticion_id
        WHERE programa.reparticion_id = ?
      `;
  
      // Ejecutar la consulta con el reparticion_id proporcionado
      const [programasFiltrados] = await connection.execute(sqlProgramasFiltrados, [reparticion_id]);
  
      if (programasFiltrados.length > 0) {
        res.status(200).json({ programas: programasFiltrados });
      } else {
        res.status(204).json({ message: "No se encontraron programas para esta repartición." });
      }
    } catch (error) {
      // Manejo de errores detallado
      console.error('Error al obtener los programas filtrados:', error);
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



////////////////INDICADORES/////////////////////////

const obtenerIndicadoresGED= async (req, res) => {
    let connection;
    try {
      connection = await conectar_BD_GED_MySql(); // Asegúrate de que esta función esté definida y se conecte correctamente a tu base de datos.
  
      // Consulta para obtener todos los proveedores
      const sqlProveedores = `
       SELECT indicador_id,indicador_det,indicador_descripcion,indicador.unidad_id,unidad_det,
(SELECT GROUP_CONCAT(programa_det) FROM programa INNER JOIN r_indicador_programa b ON programa.programa_id=b.programa_id WHERE b.indicador_id=indicador.indicador_id) programas
FROM indicador INNER JOIN unidad ON indicador.unidad_id=unidad.unidad_id
      `;
      const [indicadores] = await connection.execute(sqlProveedores);
  
      // Consulta para obtener todos los rubros asociados a cada proveedor
      const sqlProveedoresRubros = `
        SELECT r.indicador_id, r.programa_id, rb.programa_det
        FROM r_indicador_programa r
        LEFT JOIN programa rb ON r.programa_id = rb.programa_id
      `;
      const [indicadoresProgramas] = await connection.execute(sqlProveedoresRubros);
  
      // Enviar los resultados como respuesta
      res.status(200).json({ indicadores, indicadoresProgramas });
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

  const obtenerUnidadesGED = async (req, res) => {
    let connection;
    try {
      connection = await conectar_BD_GED_MySql(); 
  
      const sql = `
SELECT * FROM unidad
      `;
      const [unidades] = await connection.execute(sql);
  
      if (unidades)
      {
        res.status(200).json({ unidades });
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
  
  const agregarIndicadorGED = async (req, res) => {
    let connection;
    console.log(req.body);
    try {
      connection = await conectar_BD_GED_MySql();
  
      // Datos recibidos desde el request
      const { indicador_det,indicador_descripcion,unidad_id } = req.body.nuevoIndicador;
      const obj = req.body.selectedPrograma;
      const ids = Object.values(obj);
  
      // Iniciar una transacción
      await connection.beginTransaction();
  
      // Consulta para insertar un nuevo proveedor
      const sqlInsertIndicador = `
        INSERT INTO indicador (indicador_det,indicador_descripcion,unidad_id)
        VALUES (?, ?, ?)
      `;
  
      // Ejecución de la consulta con los valores a insertar
      const [result] = await connection.execute(sqlInsertIndicador, [
        indicador_det.toUpperCase(),
        indicador_descripcion.toUpperCase(),
         unidad_id
      ]);
  
      // Verificar si alguna fila fue afectada (es decir, si el proveedor fue insertado)
      if (result.affectedRows === 0) {
        await connection.rollback(); // Deshacer la transacción en caso de error
        return res.status(400).json({ message: "No se pudo agregar el indicador", ok: false });
      }
  
      const indicadorId = result.insertId;
  
    
      const sqlInsertProgramaIndicadorr = `
        INSERT INTO r_indicador_programa (indicador_id, programa_id)
        VALUES (?, ?)
      `;
  
    
      for (const idPrograma of ids) {
        const [resultPrograma] = await connection.execute(sqlInsertProgramaIndicadorr, [indicadorId, idPrograma]);
  
   
        if (resultPrograma.affectedRows === 0) {
          await connection.rollback(); // Deshacer la transacción en caso de error
          return res.status(400).json({ message: "No se pudo agregar el programa", ok: false });
        }
      }
  
      // Confirmar la transacción si todo fue exitoso
      await connection.commit();
  
      res.status(201).json({ message: "Indicador y programas agregados correctamente", ok: true, id: indicadorId });
    } catch (error) {
      console.error('Error al agregar el indicador y los programas:', error);
      if (connection) await connection.rollback(); // Deshacer la transacción en caso de error
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    } finally {
      // Cerrar la conexión a la base de datos
      if (connection) {
        await connection.end();
      }
    }
  };
  
  const editarIndicadorGED = async (req, res) => {
    let connection;
    try {
      connection = await conectar_BD_GED_MySql();
      
      // Datos recibidos desde el request
      const { indicador_id, indicador_det, indicador_descripcion, unidad_id } = req.body.indicadorEditado;
      const obj = req.body.selectedPrograma;
      const ids = Object.values(obj);
      
      // Iniciar una transacción
      await connection.beginTransaction();
  
      // Consulta para actualizar el indicador
      const sqlUpdateIndicador = `
        UPDATE indicador
        SET indicador_det = ?, indicador_descripcion = ?, unidad_id = ?
        WHERE indicador_id = ?
      `;
  
      // Ejecución de la consulta con los valores a actualizar
      const [result] = await connection.execute(sqlUpdateIndicador, [
        indicador_det.toUpperCase(),
        indicador_descripcion.toUpperCase(),
        unidad_id,
        indicador_id
      ]);
  
      // Verificar si alguna fila fue afectada
      if (result.affectedRows === 0) {
        await connection.rollback(); // Deshacer la transacción en caso de error
        return res.status(400).json({ message: "No se pudo actualizar el indicador", ok: false });
      }
  
      // Eliminar las relaciones anteriores entre el indicador y los programas
      const sqlDeleteRelaciones = `
        DELETE FROM r_indicador_programa
        WHERE indicador_id = ?
      `;
      await connection.execute(sqlDeleteRelaciones, [indicador_id]);
  
      // Insertar las nuevas relaciones entre el indicador y los programas
      const sqlInsertProgramaIndicador = `
        INSERT INTO r_indicador_programa (indicador_id, programa_id)
        VALUES (?, ?)
      `;
  
      for (const idPrograma of ids) {
        const [resultPrograma] = await connection.execute(sqlInsertProgramaIndicador, [indicador_id, idPrograma]);
  
        if (resultPrograma.affectedRows === 0) {
          await connection.rollback(); // Deshacer la transacción en caso de error
          return res.status(400).json({ message: "No se pudo actualizar las relaciones de programas", ok: false });
        }
      }
  
      // Confirmar la transacción si todo fue exitoso
      await connection.commit();
  
      res.status(200).json({ message: "Indicador y programas actualizados correctamente", ok: true });
    } catch (error) {
      console.error('Error al actualizar el indicador y los programas:', error);
      if (connection) await connection.rollback(); // Deshacer la transacción en caso de error
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    } finally {
      // Cerrar la conexión a la base de datos
      if (connection) {
        await connection.end();
      }
    }
  };
  
  const eliminarIndicadorGED = async (req, res) => {
    let connection;
    try {
      connection = await conectar_BD_GED_MySql();
  
      // Obtener el ID del indicador desde los parámetros de la solicitud
      const { indicador_id } = req.params;
  
      // Iniciar una transacción
      await connection.beginTransaction();
  
      // Eliminar las relaciones entre el indicador y los programas
      const sqlDeleteRelaciones = `
        DELETE FROM r_indicador_programa
        WHERE indicador_id = ?
      `;
      const [resultRelaciones] = await connection.execute(sqlDeleteRelaciones, [indicador_id]);
  
      // Eliminar el indicador de la tabla indicador
      const sqlDeleteIndicador = `
        DELETE FROM indicador
        WHERE indicador_id = ?
      `;
      const [resultIndicador] = await connection.execute(sqlDeleteIndicador, [indicador_id]);
  
      // Verificar si el indicador fue eliminado
      if (resultIndicador.affectedRows === 0) {
        await connection.rollback(); // Deshacer la transacción en caso de error
        return res.status(404).json({ message: "No se encontró el indicador", ok: false });
      }
  
      // Confirmar la transacción si todo fue exitoso
      await connection.commit();
  
      res.status(200).json({ message: "Indicador y relaciones eliminados correctamente", ok: true });
    } catch (error) {
      console.error('Error al eliminar el indicador y las relaciones:', error);
      if (connection) await connection.rollback(); // Deshacer la transacción en caso de error
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    } finally {
      // Cerrar la conexión a la base de datos
      if (connection) {
        await connection.end();
      }
    }
  };
  
  

  module.exports ={obtenerReparticionesGED,agregarReparticionGED,editarReparticionGED,eliminarReparticionGED,obtenerProgramasGED,agregarProgramaGED,editarProgramaGED,eliminarProgramaGED,obtenerIndicadoresGED,agregarIndicadorGED,editarIndicadorGED,eliminarIndicadorGED,obtenerUnidadesGED,obtenerPerfilPorCuilGED,obtenerReparticionesFiltradasGED,obtenerProgramasPorReparticionGED}