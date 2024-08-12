const mysql = require("mysql2/promise");

const conectarMySql = async () => {
  try {
    const connection = await mysql.createConnection({
      // host: process.env.HOST,
      // // host: "localhost",
      // port: 3306,
      // user: process.env.USER,
      // password: process.env.PASSWORD,
      // database: process.env.DATABASE_CIU,
      host: "192.96.215.86",
      port: 3306,
      user: "siac",
      password: "jo180401",
      database: "ciudadano",
    });
    return connection;
  } catch (error) {
    console.error("Error de conexión MySql:", error);
    throw error;
  }
};

const conectarMacroMySql = async () => {
  try {
    const connection = await mysql.createConnection({
      // host: process.env.HOST,
      // host: "localhost",
      // port: 3306,
      // user: process.env.USER,
      // password: process.env.PASSWORD,
      // database: process.env.DATABASE_CIU,
      host: "192.96.215.86",
      // port: 14306,
      port: 3306,
      user: "siac",
      password: "jo180401",
      database: "ciudadano",
    });
    return connection;
  } catch (error) {
    console.error("Error de conexión MySql:", error);
    throw error;
  }
};

const conectarYEjecutarProcedimiento = async (
  procedimientoAlmacenado,
  desde,
  hasta
) => {
  try {
    const connection = await conectarMySql();
    console.log("Conectado a MySQL");

    // Llamar a un procedimiento almacenado
    const [results, fields] = await connection.execute(
      `CALL ${procedimientoAlmacenado}(?, ?)`,
      [desde, hasta]
    );

    console.log("Resultados del procedimiento almacenado:", results);

    // Cerrar la conexión cuando hayas terminado
    await connection.end();
    console.log("Conexión cerrada");

    return results; // Devuelve los resultados de la consulta
  } catch (error) {
    console.error("Error:", error);
    throw error; // Lanza el error para que sea manejado por el controlador que llame a esta función
  }
};

module.exports = {
  conectarMySql,
  conectarYEjecutarProcedimiento,
  conectarMacroMySql,
};
