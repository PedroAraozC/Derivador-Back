const CustomError = require("../utils/customError");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { conectarBDEstadisticasMySql } = require("../config/dbEstadisticasMYSQL");

//MYSQL
const agregarUsuario = async (req, res) => { //falta
    try {
//AGREGAR TIPO DE USUARIO ID PARA EL ALTA
        const { nombreUsuario, contraseña, contraseñaRepetida,tipoDeUsuario } = req.body;

        if (contraseña !== contraseñaRepetida) {
            throw new Error("Las contraseñas no coinciden");
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(contraseña, saltRounds);

        const connection = await conectarBDEstadisticasMySql();

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
        const { dni, password } = req.body;
        if (!dni || !password)
            throw new CustomError("Usuario y contraseña son requeridas", 400);

        const connection = await conectarBDEstadisticasMySql();

        const [result] = await connection.execute(
          '    SELECT persona.*, tipo_usuario.nombre_tusuario AS tipoDeUsuario FROM persona JOIN tipo_usuario ON persona.id_tusuario = tipo_usuario.id_tusuario WHERE persona.documento_persona = ?',[dni]
        );

        if (result.length == 0) throw new CustomError("Usuario no encontrado", 404);

        const permiso_persona = await connection.execute('SELECT permiso_persona.*,proceso.nombre_proceso AS proceso,proceso.habilita AS habilitado FROM permiso_persona JOIN proceso ON permiso_persona.id_proceso=proceso.id_proceso WHERE permiso_persona.id_persona = ?',[result[0].id_persona]) 
    
        await connection.end();

      if(result[0].clave.includes("$2b$")){
        const passOk = await bcrypt.compare(password, result[0].clave);
        if (!passOk) throw new CustomError("Contraseña incorrecta", 400);
      }else if (password !== result[0].clave){
         throw new CustomError("Contraseña incorrecta", 400);
      }

        const token = jwt.sign({ id: result[0].id_persona }, process.env.JWT_SECRET_KEY, {
            expiresIn: "1h",
        });
        const { clave, ...usuarioSinContraseña } = result[0];
    
        res
            .status(200)
            .json({ message: "Ingreso correcto", ok: true,token, user: {usuarioSinContraseña,permisos:permiso_persona[0]} });
    } catch (error) {
        res
            .status(error.code || 500)
            .json({ message: error.message || "algo explotó :|" });
    }
};

const getAuthStatus = async (req, res) => {
    try {
        const id = req.id;

        const connection = await conectarBDEstadisticasMySql();
        const [user] = await connection.execute(
            'SELECT * FROM persona WHERE id_persona = ?',
            [id]
        );

        if (user.length == 0) throw new CustomError("Autenticación fallida", 401);
        const { clave, ...usuarioSinContraseña } = user[0];
        res.status(200).json({ usuarioSinContraseña });
    } catch (error) {
        res.status(error.code || 500).json({
            message:
                error.message || "Ups! Hubo un problema, por favor intenta más tarde",
        });
    }
};

const obtenerUsuarios = async (req, res) => {
  try {
    const connection = await conectarBDEstadisticasMySql();

    if (req.params.id) {
      const [user] = await connection.execute(
        'SELECT persona.*, tipo_usuario.nombre_tusuario AS tipoDeUsuario FROM persona JOIN tipo_usuario ON persona.id_tusuario = tipo_usuario.id_tusuario WHERE persona.id_persona = ?',[req.params.id]
      );

      if (user.length == 0) throw new CustomError("Usuario no encontrado", 404);
      const { clave, ...usuarioSinContraseña } = user[0];
      res.status(200).json({ usuarioSinContraseña });
    } else {
      const [users] = await connection.execute(
        'SELECT persona.*, tipo_usuario.nombre_tusuario AS tipoDeUsuario FROM persona JOIN tipo_usuario ON persona.id_tusuario = tipo_usuario.id_tusuario'
      );
      const usuariosSinClave = users.map(usuario => {
        const { clave, ...usuarioSinClave } = usuario;
        return usuarioSinClave;
      });
      res.status(200).json({ usuariosSinClave });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const editarUsuario = async (req, res) => {//falta
  try {
    const { nombreUsuario, tipoDeUsuario } = req.body;
    const userId = req.params.id;

    const sql =
      "UPDATE usuario SET nombreUsuario = ?,tipoDeUsuario_id=? WHERE id = ?";
    const values = [nombreUsuario, tipoDeUsuario, userId];

    const connection = await conectarBDEstadisticasMySql();
    const [user] = await connection.execute(
      "SELECT * FROM usuario WHERE nombreUsuario = ?",
      [nombreUsuario]
    );
    if (user.length == 0 || user[0].id == userId) {
      const [result] = await connection.execute(sql, values);
      // El resultado puede contener información sobre la cantidad de filas afectadas, etc.
      console.log("Filas actualizadas:", result.affectedRows);
      res
        .status(200)
        .json({ message: "usuario modificado con exito", nombreUsuario });
    } else {
      res
        .status(400)
        .json({
          message: "Usuario ya existente",
          userName: user[0].nombreUsuario,
        });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

const borrarUsuario = async (req, res) => {
  const { id } = req.body;

  const sql = "DELETE FROM persona WHERE id_persona = ?";
  const values = [id];

  try {
    const connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values);
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "persona eliminada con éxito" });
    } else {
      res.status(400).json({ message: "persona no encontrada" });
    }
  } catch (error) {
    console.error("Error al eliminar la persona:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
};

module.exports = { login, agregarUsuario, getAuthStatus, obtenerUsuarios,editarUsuario, borrarUsuario }