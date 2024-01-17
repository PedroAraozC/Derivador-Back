const { conectarBDUsuariosMySql } = require("../config/dbUsuariosMYSQL");
const User = require("../models/User");

const verifyRole = async (req, res, next) => {
  try {
    const id = req.id;

    const connection = await conectarBDUsuariosMySql();
    const [result] = await connection.execute(
      'SELECT * FROM usuario WHERE id = ?',
      [id]
    );
    await connection.end();

    if (result[0].tipoDeUsuario == "admin") {
      next();
    } else {
      throw new Error("Usted no está autorizado");
    }
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

module.exports = verifyRole;