const jwt = require("jsonwebtoken");
// const { conectarBDEstadisticasMySql } = require("../config/dbEstadisticasMYSQL");

const Oauth = async (req, res, next) => {
  try {
    let token = req.query.tokenAutorizacion || req.body.tokenAutorizacion;

    if (!token) {
      throw new Error("Token not provided");
    }

    console.log("OAuth req.query", req.query);
    const { id } = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.id = id;

    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = Oauth;
