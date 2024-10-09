const { conectarBDEstadisticasMySql } = require("../config/dbEstadisticasMYSQL");

const verifyRole = async (req, res, next) => {
  try {
    const id = req.id;

    const connection = await conectarBDEstadisticasMySql();

    const [result] = await connection.execute(
      '    SELECT tipo_usuario.nombre_tusuario AS tipoDeUsuario FROM persona JOIN tipo_usuario ON persona.id_tusuario = tipo_usuario.id_tusuario WHERE persona.id_persona = ?',[id]
    );

    await connection.end();

    if (result[0].tipoDeUsuario == "ADMINISTRADOR") {
      next();
    } else {
      throw new Error("Usted no está autorizado");
    }
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

module.exports = verifyRole;