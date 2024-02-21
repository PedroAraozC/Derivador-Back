const { conectarBDEstadisticasMySql } = require("../config/dbEstadisticasMYSQL");
const User = require("../models/User");

const verifyRole = async (req, res, next) => {
  try {
    const id = req.id;

    const connection = await conectarBDEstadisticasMySql();
//     SELECT usuario.*, tipoDeUsuario.rol AS tipoDeUsuario
// FROM usuario
// JOIN tipoDeUsuario ON usuario.tipoDeUsuario_id = tipoDeUsuario.id
// WHERE usuario.id = ?;

    const [result] = await connection.execute(
      '    SELECT usuario.*, tipoDeUsuario.rol AS tipoDeUsuario FROM usuario JOIN tipoDeUsuario ON usuario.tipoDeUsuario_id = tipoDeUsuario.id WHERE usuario.id = ?',
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