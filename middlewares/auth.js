const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { conectarBDUsuariosMySql } = require("../config/dbUsuariosMYSQL");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization");
    const { id } = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.id = id;

    const connection = await conectarBDUsuariosMySql();
    const [result] = await connection.execute(
      'SELECT * FROM usuario WHERE id = ?',
      [id]
    );

    req.user = result[0];
    await connection.end();
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = auth;
