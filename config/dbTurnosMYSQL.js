const mysql = require('mysql2/promise');

const conectarDBTurnos = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.HOST_TURNOS,
      user: process.env.USER_TURNOS,
      password: process.env.PASSWORD_TURNOS,
      database: process.env.DB_TURNOS,
    });
    return connection;
  } catch (error) {
    console.log(error.message);
  }
};

// const pool = new sql.ConnectionPool(config);

// async function conectarDBTurnos() {
//   try {
//     await pool.connect();
//     console.log("Conectado a SQL");
//     return pool;
//   } catch (error) {
//     console.error("Error de conexión:", error);
//     throw error;
//   }
// }

module.exports = {
  conectarDBTurnos,
};
