
const sql = require('mssql');

const config = {
  user: 'di_acalabro',
  password: 'Acalabro23*',
  server: '172.16.8.210',
  database: 'GRH_TUCUMAN',
  options: {
    encrypt: false,
  },
};

const pool = new sql.ConnectionPool(config);

async function conectarBaseDeDatos() {
  try {
    await pool.connect();
    console.log('Conectado a la base de datos');
    return pool;
  } catch (error) {
    console.error('Error de conexión:', error);
    throw error;
  }
}

module.exports = {
  conectarBaseDeDatos,
};
