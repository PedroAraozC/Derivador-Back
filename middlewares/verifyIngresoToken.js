const jwt = require("jsonwebtoken");

const verifyIngresoToken = (req, res, next) => {
  console.log(req.query)
  const token = req.query.tokenIngreso;

  if (!token) {
    return res.status(401).json({ message: "Token de ingreso no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_INGRESO);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token de ingreso no válido" });
  }
};

module.exports = verifyIngresoToken;