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

const conectarDBTurnosPrueba = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.HOST_CEMA,
      user: process.env.USER_CEMA,
      password: process.env.PASSWORD_CEMA,
      database: process.env.DATABASE_CEMA,
    });
    return connection;
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  conectarDBTurnos,conectarDBTurnosPrueba
};
