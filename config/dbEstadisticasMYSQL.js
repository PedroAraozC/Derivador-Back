const mysql = require('mysql2/promise');

const conectarBDEstadisticasMySql = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.HOST_CIU_DIGITAL,
            port: process.env.PORT_CIU_DIGITAL,
            user: process.env.USER_CIU_DIGITAL,
            password: process.env.PASSWORD_CIU_DIGITAL,
            database: process.env.DB_CIU_DIGITAL,
        });
        return connection
    } catch (error) {
        console.log(error.message);
    }
}
const conectarSMTContratacion = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.HOST_CIU_DIGITAL,
<<<<<<< HEAD
            port: process.env.PORT_CIU_DIGITAL,
=======
             port: process.env.PORT_CIU_DIGITAL,
>>>>>>> c20f3ab5b31b97c1c78b8666a50afedc3f288db7
            user: process.env.USER_CIU_DIGITAL,
            password: process.env.PASSWORD_CIU_DIGITAL,
            database: process.env.DB_CIU_CONTRATACION,
        });
        return connection
    } catch (error) {
        console.log(error.message);
    }
}
const conectarSMTPatrimonio = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.HOST_CIU_DIGITAL,
            port: process.env.PORT_CIU_DIGITAL,
            user: process.env.USER_CIU_DIGITAL,
            password: process.env.PASSWORD_CIU_DIGITAL,
            database: process.env.DB_CIU_PATRIMONIO,
        });
        return connection
    } catch (error) {
        console.log(error.message);
    }
}

// const pool = mysql.createPool({
//     host: process.env.HOST_CIU_DIGITAL,
//     user: process.env.USER_CIU_DIGITAL,
//     password: process.env.PASSWORD_CIU_DIGITAL,
//     database: process.env.DB_EDUCACION,
//     waitForConnections: true,
//     connectionLimit: 10, // Ajusta según sea necesario
//     queueLimit: 0,
// });

// const conectar_BD_GAF_MySql = async () => {
//     try {
//         const connection = await pool.getConnection();
//         return connection;
//     } catch (error) {
//         console.error('Error al conectar a la base de datos:', error.message);
//         throw error; // Lanza el error para que sea manejado por el llamador
//     }
// };

const conectar_BD_GAF_MySql = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.HOST_CIU_DIGITAL,
            user: process.env.USER_CIU_DIGITAL,
            port: process.env.PORT_CIU_DIGITAL,
            password: process.env.PASSWORD_CIU_DIGITAL,
            database: process.env.DB_GAF,
        });
        return connection
    } catch (error) {
        console.log(error.message);
    }
}
const conectar_BD_EDUCACION_MySql = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.HOST_CIU_DIGITAL,
            user: process.env.USER_CIU_DIGITAL,
            password: process.env.PASSWORD_CIU_DIGITAL,
            database: process.env.DB_EDUCACION,
            port: process.env.PORT_CIU_DIGITAL,
        });
        return connection
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = { conectarBDEstadisticasMySql, conectar_BD_GAF_MySql, conectar_BD_EDUCACION_MySql, conectarSMTContratacion, conectarSMTPatrimonio} 