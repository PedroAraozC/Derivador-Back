const CustomError = require("../utils/customError");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const login = async (req, res) => {
    try {
        const { nombreUsuario, contraseña } = req.body;
        if (!nombreUsuario || !contraseña)
            throw new CustomError("Usuario y contraseña son requeridas", 400);
        const user = await User.findOne({ nombreUsuario });
        if (!user) throw new CustomError("Usuario no encontrado", 404);
        const passOk = await bcrypt.compare(contraseña, user.contraseña);
        if (!passOk) throw new CustomError("Contraseña incorrecta", 400);
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
            expiresIn: "8h",
        });
        res
            .status(200)
            .json({ message: "Ingreso correcto", ok: true, user, token });
    } catch (error) {
        res
            .status(error.code || 500)
            .json({ message: error.message || "algo explotó :|" });
    }
};

const agregarUsuario = async (req, res) => {
    try {
        console.log(req.body);

        const { userName, password, repeatPassword } = req.body;

        if (password !== repeatPassword)
            throw new CustomError("Las contraseñas no coinciden", 400);
        const salt = await bcrypt.genSalt(10);
        const passwordEncrypted = await bcrypt.hash(password, salt);
        const user = new User({
            nombreUsuario: userName,
            contraseña: passwordEncrypted,
        });
        await user.save();
        res.status(200).json({ message: "Usuario creado con exito" });
    } catch (error) {
        res
            .status(error.code || 500)
            .json({ message: error.message || "algo explotó :(" });
    }
}

module.exports = { login, agregarUsuario }