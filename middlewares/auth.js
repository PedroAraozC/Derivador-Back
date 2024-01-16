const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization");
    const { id } = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.id = id;
    
    const user = await User.findById(id);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = auth;
