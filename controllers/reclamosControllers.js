const mysql = require('mysql2/promise');
const { conectarYEjecutarProcedimiento, conectarMySql } = require('../config/dbMYSQL');

const obtenerReclamosPorProcedimiento = async (req, res) => {
    try {
        const { procedimiento, desde, hasta } = req.body;
        console.log(req.body)
        const resultado = await conectarYEjecutarProcedimiento(procedimiento, desde, hasta);
        res.status(200).json({ resultado });
    } catch (error) {
        console.log(error);
    }
}

const obtenerProcedimientos = async (req, res) => {
    try {
        const connection = await conectarMySql();
        console.log('Conectado a MySQL');

        // Llamar a un procedimiento almacenado
        const [results, fields] = await connection.execute(process.env.QUERY_GET_PROCEDIMIENTOS);

        console.log('Resultados del procedimiento almacenado:', results);

        // Enviar la respuesta
        res.status(200).json({ results });

        // Cerrar la conexión al finalizar
        await connection.end();
        console.log('Conexión cerrada');

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error });
    }
};

module.exports = {
    obtenerReclamosPorProcedimiento,
    obtenerProcedimientos
}