const sql = require('mssql');

const config = {
  user: process.env.USER_SQL_SERVER,
  password: process.env.PASSWORD_SQL_SERVER,
  server: process.env.SERVIDOR_SQL_SERVER,
  database: process.env.DATABASE_SQL_SERVER,
  options: {
    encrypt: false,
  },
};

const pool = new sql.ConnectionPool(config);

async function conectarBaseDeDatos() {
  try {
    await pool.connect();
    console.log('Conectado a SQL');
    return pool;
  } catch (error) {
    console.error('Error de conexión:', error);
    throw error;
  }
}

module.exports = {
  conectarBaseDeDatos,
};
