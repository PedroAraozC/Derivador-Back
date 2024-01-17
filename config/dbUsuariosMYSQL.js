const mysql = require('mysql2/promise');

const conectarBDUsuariosMySql = async () => {
    try {
        const connection = await mysql.createConnection({
            host: '192.96.215.86',
            user: 'estadisticas',
            password: 'graficos2024',
            database: 'estadisticas',
        });
        return connection
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = { conectarBDUsuariosMySql } 