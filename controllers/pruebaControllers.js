const { conectarBaseDeDatos } = require("../config/db");
const sql = require('mssql');

const obtenerProcedimientos = async (req, res) => {
    try {
        // Conectar a la base de datos
        const pool = await conectarBaseDeDatos();

        // Realizar consultas u operaciones aquí

        // Ejemplo de consulta
        const result = await pool.request().query(`
            SELECT ROUTINE_NAME
            FROM information_schema.routines
            WHERE ROUTINE_TYPE = 'PROCEDURE'
            AND ROUTINE_CATALOG = 'GRH_TUCUMAN'
        `);

        console.log(result.recordset);

        // Cerrar la conexión al finalizar las operaciones
        pool.close();

        // Enviar la respuesta
        res.json(result.recordset);
    } catch (error) {
        // Manejar errores de conexión o consultas
        res.status(500).json({ error: 'Error de servidor' });
    }
}

const ejecutarProcedimiento = async (procedimientoAlmacenado, parametros = {}) => {
    try {
        const pool = await conectarBaseDeDatos();

        const request = pool.request();

        // Agregar parámetros al request (si es necesario)
        for (const key in parametros) {
            if (parametros.hasOwnProperty(key)) {
                request.input(key, parametros[key]);
            }
        }

        // Ejecutar el procedimiento almacenado
        const result = await request.execute(procedimientoAlmacenado);

        // Devolver el resultado del procedimiento almacenado
        return result.recordset;
    } catch (error) {
        console.error('Error al ejecutar el procedimiento almacenado:', error);
        throw error;
    }
}

module.exports = {
    obtenerProcedimientos,
    ejecutarProcedimiento
}