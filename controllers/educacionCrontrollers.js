const { conectar_BD_EDUCACION_MySql } = require("../config/dbEstadisticasMYSQL");
const fs = require('fs');
const path = require('path');

const sobrescribirArchivo = (rutaArchivoAntiguo, rutaArchivoNuevo) => {
  try {
    // Leer el contenido del nuevo archivo
    const contenidoNuevo = fs.readFileSync(rutaArchivoNuevo);
    // Sobrescribir el archivo antiguo con el contenido del nuevo archivo
    fs.writeFileSync(rutaArchivoAntiguo, contenidoNuevo);
    console.log(`Archivo sobrescrito: ${rutaArchivoAntiguo}`);
  } catch (error) {
    console.error(`Error al sobrescribir el archivo: ${error}`);
  }
};
// Función para obtener la ruta del archivo antiguo
const obtenerRutaArchivoAntiguo = (oldName) => {
  // Suponiendo que los archivos antiguos se guardan en una carpeta llamada 'pdfs' en el escritorio
  const rutaArchivoAntiguo = path.join('C:/Users/Tobias/Desktop', oldName);
  console.log(rutaArchivoAntiguo)
  return rutaArchivoAntiguo;
};

// Función para obtener la ruta del nuevo archivo
const obtenerRutaArchivoNuevo = (nombre_archivo) => {
  // Suponiendo que los archivos nuevos también se guardan en una carpeta llamada 'pdfs' en el escritorio
  const rutaArchivoNuevo = path.join('C:/Users/Tobias/Desktop', nombre_archivo);
  return rutaArchivoNuevo;
};

const editarConvocatoria = async (req, res) => {
  try {
    const { id, nivel, cargo, establecimiento, causal, expte, caracter, fecha, hora, habilita, num_convocatoria, anio_convocatoria, oldName } = req.body;
    // Verificar si hay un archivo adjunto
    const archivo = req.file;
    let nombre_archivo = null;
    if (archivo) {
      nombre_archivo = `CONVOCATORIA_${num_convocatoria}_${anio_convocatoria}_EXPTE_${expte}.pdf`;
      console.log(req.body)
      // Sobrescribir el archivo físico en el sistema de archivos si es necesario
      const rutaArchivoAntiguo = obtenerRutaArchivoAntiguo(oldName); // Define esta función para obtener la ruta del archivo antiguo
      const rutaArchivoNuevo = obtenerRutaArchivoNuevo(nombre_archivo); // Define esta función para obtener la ruta del archivo nuevo
      sobrescribirArchivo(rutaArchivoAntiguo, rutaArchivoNuevo); // Define esta función para sobrescribir el archivo físico
    }
    // Query para actualizar la convocatoria
    const sql = "UPDATE convocatoria SET id_nivel = ?, cargo = ?, id_establecimiento = ?, id_causal = ?, expte = ?, id_caracter = ?, fecha_designa = ?, hora_designa = ?, nombre_archivo = ?, habilita = ? WHERE id_convoca = ?";
    const values = [nivel, cargo, establecimiento, causal, expte, caracter, fecha, hora, nombre_archivo, habilita, id];

    // Verificar si la convocatoria ya existe con otra ID
    const connection = await conectar_BD_EDUCACION_MySql();
    const [convocatoria] = await connection.execute(
      "SELECT * FROM convocatoria WHERE (cargo = ? AND id_establecimiento = ? AND id_causal = ? AND expte = ? AND id_caracter = ? AND fecha_designa = ? AND hora_designa = ? AND nombre_archivo = ? AND habilita = ?) AND id_convoca != ?",
      [cargo, establecimiento, causal, expte, caracter, fecha, hora, nombre_archivo, habilita, id]
    );

    if (convocatoria.length === 0) {
      // No existe otra convocatoria con los mismos datos, se puede proceder con la actualización
      const [result] = await connection.execute(sql, values);
      console.log("Filas actualizadas:", result.affectedRows);
      res.status(200).json({ message: "Convocatoria modificada con éxito", result });
    } else {
      // Ya existe otra convocatoria con los mismos datos, devolver un error
      res.status(400).json({
        message: "Ya existe una convocatoria con los mismos datos",
        convocatoria: convocatoria[0],
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const agregarConvocatoria = async (req, res) => {
  try {
    const {
      id_nivel,
      num_convocatoria,
      anio_convocatoria,
      cargo,
      id_establecimiento,
      id_causal,
      detalle_causal,
      expte,
      id_caracter,
      fecha_publica,
      hora_publica,
      fecha_designa,
      hora_designa,
      habilita
    } = req.body;

    const archivo = req.file;

    if (!archivo) {
      return res.status(400).json({ message: "Por favor, adjunta un archivo" });
    }

    // Obtener el nombre del archivo cargado
    const nombre_archivo = archivo.originalname;
    
    // Obtener el último id_convoca de la tabla
    const connection = await conectar_BD_EDUCACION_MySql();
    const [lastIdResult] = await connection.query("SELECT MAX(id_convoca) AS max_id FROM convocatoria");

    let nextId = lastIdResult[0].max_id + 1; // Generar el próximo id_convoca

    // Query para insertar una nueva convocatoria
    const sql =
      "INSERT INTO convocatoria (id_convoca, id_nivel, num_convocatoria, anio_convocatoria, cargo, id_establecimiento, id_causal, detalle_causal, expte, id_caracter, fecha_publica, hora_publica, fecha_designa, hora_designa, habilita, nombre_archivo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const values = [
      nextId,
      id_nivel,
      num_convocatoria,
      anio_convocatoria,
      cargo,
      id_establecimiento,
      id_causal,
      detalle_causal,
      expte,
      id_caracter,
      fecha_publica,
      hora_publica,
      fecha_designa,
      hora_designa,
      habilita,
      nombre_archivo
    ];

    // Ejecutar la consulta SQL para insertar la nueva convocatoria
    await connection.execute(sql, values);

    res.status(201).json({ message: "Convocatoria creada con éxito", id: nextId, num_convocatoria: num_convocatoria });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const listarConvocatorias =async(req,res)=>{
    const connection = await conectar_BD_EDUCACION_MySql();
  try {
      const [convocatorias] = await connection.execute(
        'SELECT c.*, cau.nombre_causal, n.nombre_nivel, car.nombre_caracter, e.nombre_establecimiento, e.domicilio FROM convocatoria c ' +
        'left JOIN establecimiento e ON c.id_establecimiento = e.id_establecimiento ' +
        'left JOIN causal cau ON c.id_causal = cau.id_causal ' +
        'left JOIN caracter car ON c.id_caracter = car.id_caracter ' +
        'left JOIN nivel n ON c.id_nivel = n.id_nivel WHERE c.habilita = 1'
      );
      res.status(200).json({convocatorias})
     
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }  finally {
      if (connection) {
        connection.release();
      }
    }
}

const listarNiveles =async(req,res)=>{
    const connection = await conectar_BD_EDUCACION_MySql();
  try {
      const [niveles] = await connection.execute(
        'SELECT * FROM nivel WHERE habilita = 1'
      );
      res.status(200).json({niveles})
     
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }  finally {
      if (connection) {
        connection.release();
      }
    }
}

const listarEstablecimientos =async(req,res)=>{
    const connection = await conectar_BD_EDUCACION_MySql();
  try {
      const [establecimientos] = await connection.execute(
        'SELECT * FROM establecimiento WHERE habilita = 1'
      );
      res.status(200).json({establecimientos})
     
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }  finally {
      if (connection) {
        connection.release();
      }
    }
}
const listarCausal =async(req,res)=>{
    const connection = await conectar_BD_EDUCACION_MySql();
  try {
      const [causal] = await connection.execute(
        'SELECT * FROM causal WHERE habilita = 1'
      );
      res.status(200).json({causal})
     
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }  finally {
      if (connection) {
        connection.release();
      }
    }
}
const listarCausalTabla =async(req,res)=>{
    const connection = await conectar_BD_EDUCACION_MySql();
  try {
      const [causal] = await connection.execute(
        'SELECT *, case when habilita = 1 then "SI" else "NO" end as habilita2 FROM causal'
      );
      res.status(200).json({causal})
     
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }  finally {
      if (connection) {
        connection.release();
      }
    }
}
const listarCaracter =async(req,res)=>{
    const connection = await conectar_BD_EDUCACION_MySql();
  try {
      const [caracter] = await connection.execute(
        'SELECT * FROM caracter WHERE habilita = 1'
      );
      res.status(200).json({caracter})
     
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }  finally {
      if (connection) {
        connection.release();
      }
    }
}

const agregarCausal = async (req, res) => {
  try {
    const {
      nombre_causal,
      habilita
    } = req.body;

    // Obtener el último id_causal de la tabla
    const connection = await conectar_BD_EDUCACION_MySql();
    const [lastIdResult] = await connection.query("SELECT MAX(id_causal) AS max_id FROM causal");

    let nextId = lastIdResult[0].max_id + 1; // Generar el próximo id_causal

    // Query para insertar una nueva causal
    const sql =
      "INSERT INTO causal (id_causal, nombre_causal, habilita) VALUES (?, ?, ?)";
    const values = [
      nextId,
      nombre_causal,
      habilita,
    ];

    // Ejecutar la consulta SQL para insertar la nueva causal
    await connection.execute(sql, values);

    res.status(201).json({ message: "Causal creada con éxito", id: nextId, nombre_causal: nombre_causal });

    connection.release();

  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
}






module.exports={ listarConvocatorias, listarNiveles, listarEstablecimientos, listarCausal, listarCaracter, editarConvocatoria, agregarConvocatoria, agregarCausal, listarCausalTabla }