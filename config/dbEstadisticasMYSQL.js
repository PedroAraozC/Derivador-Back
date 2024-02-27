const mysql = require('mysql2/promise');

const conectarBDEstadisticasMySql = async () => {
    try {
        const connection = await mysql.createConnection({
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

const conectar_BD_GAF_MySql = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.HOST_CIU_DIGITAL,
            user: process.env.USER_CIU_DIGITAL,
            password: process.env.PASSWORD_CIU_DIGITAL,
            database: process.env.DB_GAF,
        });
        return connection
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = { conectarBDEstadisticasMySql, conectar_BD_GAF_MySql} 