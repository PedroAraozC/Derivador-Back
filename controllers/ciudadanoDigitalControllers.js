const { conectarBDEstadisticasMySql } = require("../config/dbEstadisticasMYSQL");

const listarOpciones =async(req,res)=>{
    let connection;
    try {
    
        connection = await conectarBDEstadisticasMySql();

        const [opciones] = await connection.execute(
            'SELECT * FROM opcion WHERE habilita=1'
        );
        res.status(200).json({opciones})
    } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    } finally {
        connection.end()
    }
}

const listarProcesos =async(req,res)=>{
    let connection;
    try {
    
        connection = await conectarBDEstadisticasMySql();

        const [procesos] = await connection.execute(
            'SELECT proceso.*, opcion.nombre_opcion AS opcion FROM proceso JOIN opcion ON proceso.id_opcion = opcion.id_opcion'
        );
        res.status(200).json({procesos})
    } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    } finally {
        connection.end()
    }
}

const listarTiposDeUsuarios =async(req,res)=>{
    let connection;
    try {
    
        connection = await conectarBDEstadisticasMySql();

        const [procesos] = await connection.execute(
            'SELECT * FROM tipo_usuario WHERE habilita=1'
        );
        res.status(200).json({procesos})
    } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    } finally {
        connection.end()
    }
}

const obtenerPaisesMYSQL = async (req, res) => {
    let connection;
    try {
        // Establecer la conexión a la base de datos MySQL
        connection = await conectarBDEstadisticasMySql();

        // Realizar la consulta a la base de datos
        const [rows, fields] = await connection.query('SELECT * FROM pais WHERE habilita=1');

        // Verificar si se encontraron resultados
        if (rows && rows.length > 0) {
            rows.sort((a, b) => a.nombre_pais.localeCompare(b.nombre_pais));
            res.status(200).json({ ciudadanos: rows });
        } else {
            res.status(404).json({ message: "No se encontraron usuarios" });
        }
    } catch (error) {
        // Manejo de errores específicos
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            res.status(500).json({ message: "Error de acceso a la base de datos" });
        } else if (error.code === 'ECONNREFUSED') {
            res.status(500).json({ message: "No se pudo conectar a la base de datos" });
        } else {
            res.status(500).json({ message: error.message || "Algo salió mal :(" });
        }
    } finally {
        // Cerrar la conexión a la base de datos
        if (connection) {
            connection.end();
        }
    }
};

const obtenerProvinciasMYSQL = async (req, res) => {
    let connection;
    try {
        // Establecer la conexión a la base de datos MySQL
        connection = await conectarBDEstadisticasMySql();

        // Realizar la consulta a la base de datos
        const [rows, fields] = await connection.query('SELECT * FROM provincia WHERE habilita=1');

        // Verificar si se encontraron resultados
        if (rows && rows.length > 0) {
            rows.sort((a, b) => a.nombre_provincia.localeCompare(b.nombre_provincia));
            res.status(200).json({ ciudadanos: rows });
        } else {
            res.status(404).json({ message: "No se encontraron usuarios" });
        }
    } catch (error) {
        // Manejo de errores específicos
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            res.status(500).json({ message: "Error de acceso a la base de datos" });
        } else if (error.code === 'ECONNREFUSED') {
            res.status(500).json({ message: "No se pudo conectar a la base de datos" });
        } else {
            res.status(500).json({ message: error.message || "Algo salió mal :(" });
        }
    } finally {
        // Cerrar la conexión a la base de datos
        if (connection) {
            connection.end();
        }
    }
};

const obtenerGeneroMYSQL = async (req, res) => {
    let connection;
    try {
        // Establecer la conexión a la base de datos MySQL
        connection = await conectarBDEstadisticasMySql();

        // Realizar la consulta a la base de datos
        const [rows, fields] = await connection.query('SELECT * FROM genero WHERE habilita=1');

        // Verificar si se encontraron resultados
        if (rows && rows.length > 0) {
            res.status(200).json({ ciudadanos: rows });
        } else {
            res.status(404).json({ message: "No se encontraron usuarios" });
        }
    } catch (error) {
        // Manejo de errores específicos
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            res.status(500).json({ message: "Error de acceso a la base de datos" });
        } else if (error.code === 'ECONNREFUSED') {
            res.status(500).json({ message: "No se pudo conectar a la base de datos" });
        } else {
            res.status(500).json({ message: error.message || "Algo salió mal :(" });
        }
    } finally {
        // Cerrar la conexión a la base de datos
        if (connection) {
            connection.end();
        }
    }
};

const obtenerDocumentoMYSQL = async (req, res) => {
    let connection;
    try {
        // Establecer la conexión a la base de datos MySQL
        connection = await conectarBDEstadisticasMySql();

        // Realizar la consulta a la base de datos
        const [rows, fields] = await connection.query('SELECT * FROM tipo_documento WHERE habilita=1');

        // Verificar si se encontraron resultados
        if (rows && rows.length > 0) {
            res.status(200).json({ ciudadanos: rows });
        } else {
            res.status(404).json({ message: "No se encontraron usuarios" });
        }
    } catch (error) {
        // Manejo de errores específicos
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            res.status(500).json({ message: "Error de acceso a la base de datos" });
        } else if (error.code === 'ECONNREFUSED') {
            res.status(500).json({ message: "No se pudo conectar a la base de datos" });
        } else {
            res.status(500).json({ message: error.message || "Algo salió mal :(" });
        }
    } finally {
        // Cerrar la conexión a la base de datos
        if (connection) {
            connection.end();
        }
    }
};

module.exports={listarOpciones,listarProcesos,listarTiposDeUsuarios,obtenerPaisesMYSQL, obtenerProvinciasMYSQL, obtenerGeneroMYSQL, obtenerDocumentoMYSQL}