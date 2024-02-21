const mysql = require('mysql2/promise');

const conectarBDEstadisticasMySql = async () => {
    try {
        const connection = await mysql.createConnection({
            // host: process.env.HOST,
            // user: process.env.USER_ESTADISTICAS,
            // password: process.env.PASSWORD_ESTADISTICAS,
            // database: process.env.DATABASE_ESTADISTICAS,
            host: process.env.HOST_CIU_DIGITAL,
            user: process.env.USER_CIU_DIGITAL,
            password: process.env.PASSWORD_CIU_DIGITAL,
            database: process.env.DB_CIU_DIGITAL,
        });
        return connection
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = { conectarBDEstadisticasMySql } 