const CustomError = require("../utils/customError");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { conectarBDUsuariosMySql } = require("../config/dbUsuariosMYSQL");

//MYSQL
const agregarUsuario = async (req, res) => {
    try {
//AGREGAR TIPO DE USUARIO ID PARA EL ALTA
        const { nombreUsuario, contraseña, contraseñaRepetida,tipoDeUsuario } = req.body;

        if (contraseña !== contraseñaRepetida) {
            throw new Error("Las contraseñas no coinciden");
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(contraseña, saltRounds);

        const connection = await conectarBDUsuariosMySql();

        const [user] = await connection.execute(
            'SELECT * FROM usuario WHERE nombreUsuario = ?',
            [nombreUsuario]
        );
        if (user.length == 0) {

            const [result] = await connection.execute(
                'INSERT INTO usuario (nombreUsuario, contraseña,tipoDeUsuario_id) VALUES (?, ?,?)',
                [nombreUsuario, hashedPassword,tipoDeUsuario]
            );

            await connection.end();

            res.status(200).json({ message: "Usuario creado con éxito", insertedId: result.insertId });
        } else {
            res.status(400).json({ message: "Usuario ya existente", userName: user[0].nombreUsuario });
        }
    } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
};

const login = async (req, res) => {
    try {
        const { nombreUsuario, password } = req.body;
        if (!nombreUsuario || !password)
            throw new CustomError("Usuario y contraseña son requeridas", 400);

        const connection = await conectarBDUsuariosMySql();
        const [result] = await connection.execute(
            'SELECT * FROM usuario WHERE nombreUsuario = ?',
            [nombreUsuario]
        );

        await connection.end();
        if (result.length == 0) throw new CustomError("Usuario no encontrado", 404);
        const passOk = await bcrypt.compare(password, result[0].contraseña);
        if (!passOk) throw new CustomError("Contraseña incorrecta", 400);
        const token = jwt.sign({ id: result[0].id }, process.env.JWT_SECRET_KEY, {
            expiresIn: "8h",
        });
        const { contraseña, ...usuarioSinContraseña } = result[0];
        res
            .status(200)
            .json({ message: "Ingreso correcto", ok: true, token, user: usuarioSinContraseña });
    } catch (error) {
        res
            .status(error.code || 500)
            .json({ message: error.message || "algo explotó :|" });
    }
};

const getAuthStatus = async (req, res) => {
    try {
        const id = req.id;

        const connection = await conectarBDUsuariosMySql();
        const [user] = await connection.execute(
            'SELECT * FROM usuario WHERE id = ?',
            [id]
        );

        if (user.length == 0) throw new CustomError("Autenticación fallida", 401);
        const { contraseña, ...usuarioSinContraseña } = user[0];
        res.status(200).json({ usuarioSinContraseña });
    } catch (error) {
        res.status(error.code || 500).json({
            message:
                error.message || "Ups! Hubo un problema, por favor intenta más tarde",
        });
    }
};

//MONGO DB
// const agregarUsuario = async (req, res) => {
//     try {
//         console.log(req.body);

//         const { userName, password, repeatPassword } = req.body;

//         if (password !== repeatPassword)
//             throw new CustomError("Las contraseñas no coinciden", 400);
//         const salt = await bcrypt.genSalt(10);
//         const passwordEncrypted = await bcrypt.hash(password, salt);
//         const user = new User({
//             nombreUsuario: userName,
//             contraseña: passwordEncrypted,
//         });
//         await user.save();
//         res.status(200).json({ message: "Usuario creado con exito" });
//     } catch (error) {
//         res
//             .status(error.code || 500)
//             .json({ message: error.message || "algo explotó :(" });
//     }
// }


// const login = async (req, res) => {
//     try {
//         const { nombreUsuario, contraseña } = req.body;
//         if (!nombreUsuario || !contraseña)
//             throw new CustomError("Usuario y contraseña son requeridas", 400);
//         const user = await User.findOne({ nombreUsuario });
//         if (!user) throw new CustomError("Usuario no encontrado", 404);
//         const passOk = await bcrypt.compare(contraseña, user.contraseña);
//         if (!passOk) throw new CustomError("Contraseña incorrecta", 400);
//         const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
//             expiresIn: "8h",
//         });
//         res
//             .status(200)
//             .json({ message: "Ingreso correcto", ok: true, user, token });
//     } catch (error) {
//         res
//             .status(error.code || 500)
//             .json({ message: error.message || "algo explotó :|" });
//     }
// };


module.exports = { login, agregarUsuario, getAuthStatus }