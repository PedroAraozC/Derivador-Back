const CustomError = require("../utils/customError");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  conectarBDEstadisticasMySql,
} = require("../config/dbEstadisticasMYSQL");
const nodemailer = require("nodemailer");
const moment = require("moment-timezone");
const Persona = require("../models/Derivador/Persona");
const Empleado = require("../models/Derivador/Empleado");
const { sequelize_ciu_digital_derivador } = require("../config/sequelize");

// Configurar el transporte de Nodemailer
const transporter = nodemailer.createTransport({
  // host: 'smtp.gmail.com',
  service: "gmail",
  // port: 465,
  // secure: true,
  auth: {
    user: "no-reply-cdigital@smt.gob.ar",
    pass: process.env.PASSWORD_MAIL,
  },
});

// const transporter = nodemailer.createTransport({
//   service: 'Zoho',
//   auth: {
//     user: 'develop.ditec@zohomail.com',
//      pass: process.env.PASSWORD_MAIL

//   }
// });

//funciones
const enviarEmail = (codigo, email, cuil) => {
  try {
    const mailOptions = {
      from: "SMT-Ciudadano Digital <no-reply-cdigital@smt.gob.ar>",
      to: email,
      subject: "Código de validación",
      text: `Tu código de validación es: ${codigo}. Para visualizar su credencial de Ciudadano Digital ingrese al siguiente link: https://ciudaddigital.smt.gob.ar/#/credencialesCiudadano/${cuil}`,
    };

    transporter.sendMail(mailOptions, (errorEmail, info) => {
      if (errorEmail) {
        console.log("error al enviar correo");
        // return res.status(500).json({ mge: 'Error al enviar el correo electrónico:', ok: false, error: errorEmail });
      } else {
        // return res.status(200).json({mge:'Correo electrónico enviado correctamente:',ok: true});
        console.log("email enviado");
      }
    });
  } catch (error) {
    console.log("error al enviar email");
  }
};

const generarCodigo = (numero) => {
  const numeroInvertido = parseInt(
    numero.toString().split("").reverse().join("")
  );
  const ultimosCuatroDigitos = numeroInvertido % 10000;
  return ultimosCuatroDigitos;
};

function generarCodigoAfaNumerico() {
  const caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let codigo = "";

  for (let i = 0; i < 8; i++) {
    const indice = Math.floor(Math.random() * caracteres.length);
    codigo += caracteres.charAt(indice);
  }

  return codigo;
}

//VALIDACION DE EMPLEADO PARA ASIGNAR TIPO DE USUARIO
const validarEmpleado = async (cuil) => {
  try {
    const JSONdata = JSON.stringify({
      tarea: "legajo_municipal",
      cuil: cuil,
    });
    const endpoint = "http://181.105.6.205:82/api_civitas/ciudadano.php";

    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSONdata,
    };
    const response = await fetch(endpoint, options);

    const result = await response.json();
    console.log(result.legajo[0]);
    return result;
  } catch (error) {
    console.log(error);
  }
};

// -----------------------------------------------------------------------------------------------------

//controladores
const login = async (req, res) => {
  let connection;

  try {
    connection = await conectarBDEstadisticasMySql();
    const { dni, password } = req.body;
    if (!dni || !password)
      throw new CustomError("Usuario y contraseña son requeridas", 400);

    const [result] = await connection.execute(
      "    SELECT persona.*, tipo_usuario.nombre_tusuario AS tipoDeUsuario FROM persona JOIN tipo_usuario ON persona.id_tusuario = tipo_usuario.id_tusuario WHERE persona.documento_persona = ? AND persona.habilita = 1",
      [dni]
    );

    if (result.length == 0) throw new CustomError("Usuario no encontrado", 404);

    if (result[0].validado == 0)
      throw new CustomError(
        "Usuario no validado. Revise su correo o reenvie el email de validación",
        404
      );

    const permiso_persona = await connection.execute(
      "SELECT permiso_persona.*,proceso.nombre_proceso AS proceso,proceso.habilita AS habilitado FROM permiso_persona JOIN proceso ON permiso_persona.id_proceso=proceso.id_proceso WHERE permiso_persona.id_persona = ?",
      [result[0].id_persona]
    );

    // await connection.end();

    const passOk = await bcrypt.compare(password, result[0].clave);
    if (!passOk) throw new CustomError("Contraseña incorrecta", 400);

    const token = jwt.sign(
      { id: result[0].id_persona },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "1h",
      }
    );
    const { clave, ...usuarioSinContraseña } = result[0];

    res.status(200).json({
      message: "Ingreso correcto",
      ok: true,
      token,
      user: { usuarioSinContraseña, permisos: permiso_persona[0] },
    });
  } catch (error) {
    res
      .status(error.code || 500)
      .json({ message: error.message || "algo explotó :|" });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const getAuthStatus = async (req, res) => {
  let connection;
  try {
    connection = await conectarBDEstadisticasMySql();
    const id = req.id;

    const [user] = await connection.execute(
      "SELECT * FROM persona WHERE id_persona = ?",
      [id]
    );

    if (user.length == 0) throw new CustomError("Autenticación fallida", 401);
    const { clave, ...usuarioSinContraseña } = user[0];
    // await connection.end();
    res.status(200).json({ usuarioSinContraseña });
  } catch (error) {
    res.status(error.code || 500).json({
      message:
        error.message || "Ups! Hubo un problema, por favor intenta más tarde",
    });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const obtenerUsuarios = async (req, res) => {
  let connection;
  try {
    connection = await conectarBDEstadisticasMySql();

    if (req.params.id) {
      const [user] = await connection.execute(
        "SELECT persona.*, tipo_usuario.nombre_tusuario AS tipoDeUsuario FROM persona JOIN tipo_usuario ON persona.id_tusuario = tipo_usuario.id_tusuario WHERE persona.id_persona = ?",
        [req.params.id]
      );

      if (user.length == 0) throw new CustomError("Usuario no encontrado", 404);
      const { clave, ...usuarioSinContraseña } = user[0];
      res.status(200).json({ usuarioSinContraseña });
    } else {
      const [users] = await connection.execute(
        "SELECT persona.*, tipo_usuario.nombre_tusuario AS tipoDeUsuario FROM persona JOIN tipo_usuario ON persona.id_tusuario = tipo_usuario.id_tusuario"
      );
      const usuariosSinClave = users.map((usuario) => {
        const { clave, ...usuarioSinClave } = usuario;
        return usuarioSinClave;
      });
      // await connection.end();
      res.status(200).json({ usuariosSinClave });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const obtenerPermisos = async (req, res) => {
  let connection;
  try {
    connection = await conectarBDEstadisticasMySql();

    //CAMBIE EL CONTROLADOR PARA USAR SOLO LOS PERMISOS POR EL TIPO DE USUARIO YA QUE TIENE MENOS REGISTROS Y PUEDEN DARSE
    // MAS FACIL LA BAJA Y EL ALTA DE ESTOS PERMISOS, SOLO QUEDA PROBARLOS Y DEJAR BIEN DEFINIDOS LOS TIPOS DE USUARIO QUE
    // VAN A EXISTIR PARA QUE CADA UNO TENGA LOS PERMISOS NECESARIOS
    // TAMBIEN HAY QUE VER SI ESTE DERIVADOR SERÁ SOLAMENTE EL BACK OFFICE Y DEJARLO SOLAMENTE CON LOS PANELES ADMIN

    if (req.params.id) {
      const [user] = await connection.execute(
        // `SELECT pp.*, pro.descripcion, pro.nombre_proceso, o.id_opcion, o.nombre_opcion
        // FROM permiso_persona pp
        // LEFT JOIN proceso pro ON pp.id_proceso = pro.id_proceso
        // LEFT JOIN opcion o ON pro.id_opcion = o.id_opcion
        // WHERE pp.id_persona = ?
        // ORDER BY pro.id_proceso ASC`,
        `SELECT pu.*, pro.descripcion, pro.nombre_proceso, o.id_opcion, o.nombre_opcion
        FROM permiso_tusuario pu
        LEFT JOIN proceso pro ON pu.id_proceso = pro.id_proceso 
        LEFT JOIN opcion o ON pro.id_opcion = o.id_opcion
        WHERE pu.id_tusuario = ?
        ORDER BY o.id_opcion ASC`,
        [req.params.id]
      );

      if (user.length === 0)
        throw new CustomError("Usuario no encontrado", 404);
      res.status(200).json({ usuario: user });
    } else {
      const [users] = await connection.execute(
        `SELECT persona.*, tipo_usuario.nombre_tusuario AS tipoDeUsuario FROM persona JOIN tipo_usuario ON persona.id_tusuario = tipo_usuario.id_tusuario`
      );
      // await connection.end();
      res.status(200).json({ usuarios: users });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const obtenerOpcionesHabilitadas = async (req, res) => {
  let connection;
  try {
    connection = await conectarBDEstadisticasMySql();

    const [opciones] = await connection.execute(
      `SELECT pu.*, pro.descripcion, pro.nombre_proceso, o.id_opcion, o.nombre_opcion
      FROM permiso_tusuario pu
      LEFT JOIN proceso pro ON pu.id_proceso = pro.id_proceso 
      LEFT JOIN opcion o ON pro.id_opcion = o.id_opcion
      WHERE pu.id_tusuario = 1
      ORDER BY o.id_opcion ASC`
    );
    // await connection.end();
    res.status(200).json({ opciones });
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const editarUsuario = async (req, res) => {
  //falta
  let connection;
  try {
    const { nombreUsuario, tipoDeUsuario } = req.body;
    const userId = req.params.id;

    const sql =
      "UPDATE usuario SET nombreUsuario = ?,tipoDeUsuario_id=? WHERE id = ?";
    const values = [nombreUsuario, tipoDeUsuario, userId];

    connection = await conectarBDEstadisticasMySql();
    const [user] = await connection.execute(
      "SELECT * FROM usuario WHERE nombreUsuario = ?",
      [nombreUsuario]
    );
    if (user.length == 0 || user[0].id == userId) {
      const [result] = await connection.execute(sql, values);
      // await connection.end();
      // El resultado puede contener información sobre la cantidad de filas afectadas, etc.
      console.log("Filas actualizadas:", result.affectedRows);
      res
        .status(200)
        .json({ message: "usuario modificado con exito", nombreUsuario });
    } else {
      res.status(400).json({
        message: "Usuario ya existente",
        userName: user[0].nombreUsuario,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const editarUsuarioCompleto = async (req, res) => {
  let connection;
  try {
    const {
      documento_persona,
      nombre_persona,
      apellido_persona,
      email_persona,
      telefono_persona,
      domicilio_persona,
      localidad_persona,
    } = req.body;

    //const hashedPassword = await bcrypt.hash(clave, 10);

    // Establecer la conexión a la base de datos MySQL
    connection = await conectarBDEstadisticasMySql();

    // Consultar el usuario por su documento
    const [result] = await connection.query(
      "SELECT * FROM persona WHERE documento_persona = ?",
      [documento_persona]
    );

    // Verificar si se encontró el usuario
    if (result.length > 0) {
      const usuario = result[0];
      // Actualizar el usuario
      await connection.query(
        "UPDATE persona SET nombre_persona = ?, apellido_persona = ?, email_persona = ?, telefono_persona = ?, domicilio_persona = ?, localidad_persona = ? WHERE documento_persona = ?",
        [
          nombre_persona.toUpperCase(),
          apellido_persona.toUpperCase(),
          email_persona,
          telefono_persona,
          domicilio_persona.toUpperCase(),
          localidad_persona.toUpperCase(),
          documento_persona,
        ]
      );
      // await connection.end();
      return res
        .status(200)
        .json({ message: "Usuario editado con éxito", ok: true });
    } else {
      // await connection.end();
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || "Algo salió mal :(" });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const borrarUsuario = async (req, res) => {
  const { id } = req.body;

  const sql = "DELETE FROM persona WHERE id_persona = ?";
  const values = [id];
  let connection;
  try {
    connection = await conectarBDEstadisticasMySql();
    const [result] = await connection.execute(sql, values);
    // await connection.end();
    if (result.affectedRows > 0) {
      res.status(200).json({ message: "persona eliminada con éxito" });
    } else {
      res.status(400).json({ message: "persona no encontrada" });
    }
  } catch (error) {
    console.error("Error al eliminar la persona:", error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const obtenerCiudadanoPorDNIMYSQL = async (req, res) => {
  let connection;
  try {
    connection = await conectarBDEstadisticasMySql();

    const userDNI = req.params.dni;
    const queryResult = await connection.query(
      "SELECT * FROM persona WHERE documento_persona = ?",
      [userDNI]
    );
    // await connection.end();
    if (queryResult.length > 0) {
      const ciudadano = queryResult[0]; // Suponiendo que solo hay un usuario con ese DNI
      if (ciudadano.length > 0) {
        res.status(200).json({ ciudadano });
      } else {
        res.status(200).json({ message: "Usuario no encontrado" });
      }
    } else {
      res.status(200).json({ message: "Usuario no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const obtenerCiudadanoPorEmailMYSQL = async (req, res) => {
  let connection;
  try {
    connection = await conectarBDEstadisticasMySql();

    const userEmail = req.params.email;
    const queryResult = await connection.query(
      "SELECT * FROM persona WHERE email_persona = ?",
      [userEmail]
    );
    // await connection.end();
    if (queryResult.length > 0) {
      const ciudadano = queryResult[0]; // Suponiendo que solo hay un usuario con ese DNI
      if (ciudadano.length > 0) {
        res.status(200).json({ ciudadano });
      } else {
        res.status(200).json({ message: "Usuario no encontrado" });
      }
    } else {
      res.status(200).json({ message: "Usuario no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const validarUsuarioMYSQL = async (req, res) => {
  let connection;
  try {
    const { email_persona, codigo_verif } = req.body;

    // Establecer la conexión a la base de datos MySQL
    connection = await conectarBDEstadisticasMySql();

    // Consultar el usuario por su email
    const [result] = await connection.query(
      "SELECT * FROM persona WHERE email_persona = ?",
      [email_persona]
    );

    // Verificar si se encontró el usuario
    if (result.length > 0) {
      const usuario = result[0];
      const codigo = generarCodigo(usuario.documento_persona);

      // Verificar si el usuario ya está validado
      if (!usuario.validado) {
        // Verificar si el código de verificación coincide
        if (codigo === codigo_verif) {
          // Actualizar el estado de validación del usuario
          await connection.query(
            "UPDATE persona SET validado = 1, habilita = 1 WHERE email_persona = ?",
            [email_persona]
          );
          await connection.end();
          return res
            .status(200)
            .json({ message: "Usuario validado con éxito", ok: true });
        } else {
          await connection.end();
          return res.status(200).json({
            message: "El código de verificación es incorrecto",
            ok: false,
          });
        }
      } else {
        await connection.end();
        return res
          .status(200)
          .json({ message: "El usuario ya está validado", ok: false });
      }
    } else {
      await connection.end();
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || "Algo salió mal :(" });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const agregarUsuarioMYSQL = async (req, res) => {
  let connection;
  try {
    const {
      documento_persona,
      nombre_persona,
      apellido_persona,
      email_persona,
      clave,
      telefono_persona,
      domicilio_persona,
      id_provincia,
      localidad_persona,
      id_pais,
      fecha_nacimiento_persona,
      id_genero,

      validado,
      habilita,
    } = req.body;

    const hashedPassword = await bcrypt.hash(clave, 10);

    const fechaStr = fecha_nacimiento_persona;
    const fechaFormateada = moment(fechaStr).format("YYYY-MM-DD");

    const codigoValidacion = generarCodigo(documento_persona);

    connection = await conectarBDEstadisticasMySql();

    // Consultar si ya existe un usuario con el mismo email o documento
    const [resultEmail] = await connection.query(
      "SELECT * FROM persona WHERE email_persona = ?",
      [email_persona]
    );
    if (resultEmail.length > 0) {
      return res
        .status(400)
        .json({ message: "Email ya registrado", userEmail: email_persona });
    }

    const [resultDocumento] = await connection.query(
      "SELECT * FROM persona WHERE documento_persona = ?",
      [documento_persona]
    );
    if (resultDocumento.length > 0) {
      return res
        .status(400)
        .json({ message: "DNI ya registrado", userDNI: documento_persona });
    }

    const empleadoValidado = await validarEmpleado(documento_persona);

    if (empleadoValidado && empleadoValidado?.legajo[0] !== null) {
      // Se encontró un legajo
      // Iniciar una transacción
      const transaction = await sequelize_ciu_digital_derivador.transaction();

      const [resultReparticion] = await connection.query(
        "SELECT * FROM reparticion WHERE reparticion.habilita = 1 AND reparticion.item = ?",
        [empleadoValidado.legajo[0].codi_17]
      );
      let id_rep = resultReparticion[0].id_reparticion;
      let usuarioEmpleado = 4;
      // Insertar el nuevo usuario con legajo
      const nuevaPersona = await Persona.create(
        {
          documento_persona,
          nombre_persona: nombre_persona.toUpperCase(),
          apellido_persona: apellido_persona.toUpperCase(),
          email_persona,
          clave: hashedPassword,
          telefono_persona,
          domicilio_persona: domicilio_persona?.toUpperCase(),
          id_provincia,
          id_pais,
          localidad_persona: localidad_persona?.toUpperCase(),
          fecha_nacimiento_persona: fechaFormateada,
          id_genero,
          id_tdocumento: null,
          id_tusuario: usuarioEmpleado,
        },
        { transaction }
      );
      const [resultPersona] = await connection.query(
        "SELECT * FROM persona p WHERE p.documento_persona = ?",
        [documento_persona]
      );
      let id_per = resultPersona[0].id_persona;
      let afil = empleadoValidado.legajo[0].lega_12;
      const nuevoEmpleado = await Empleado.create(
        {
          id_persona: id_per,
          afiliado: afil,
          id_reparticion: id_rep,
        },
        { transaction }
      );

      await transaction.commit();
    } else {
      // No se encontró un legajo
      console.log("No se encontró un legajo");
      // Insertar el nuevo usuario
      const [resultInsert] = await connection.query(
        "INSERT INTO persona (documento_persona, nombre_persona, apellido_persona, email_persona, clave, telefono_persona, domicilio_persona, id_provincia, id_pais, localidad_persona, validado, habilita, fecha_nacimiento_persona, id_genero) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,  ?, ?, ?)",
        [
          documento_persona,
          nombre_persona.toUpperCase(),
          apellido_persona.toUpperCase(),
          email_persona,
          hashedPassword,
          telefono_persona,
          domicilio_persona?.toUpperCase(),
          id_provincia,
          id_pais,
          localidad_persona?.toUpperCase(),
          validado,
          habilita,
          fechaFormateada,
          id_genero,
        ]
      );
    }
    // Enviar correo electrónico al usuario recién registrado
    enviarEmail(codigoValidacion, email_persona, documento_persona);

    await connection.end();
    res.status(200).json({ message: "Ciudadano creado con éxito", ok: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end();
    }
  }
};

const enviarEmailValidacion = async (req, res) => {
  let connection;

  try {
    connection = await conectarBDEstadisticasMySql();

    const { email_persona, documento_persona } = req.body;

    const queryResult = await connection.query(
      "SELECT * FROM persona WHERE documento_persona = ?",
      [documento_persona]
    );

    if (queryResult[0].length == 0) {
      return res.status(200).json({ mge: "Usuario no registrado", ok: false });
    }

    const validado = queryResult[0][0].validado;
    // const documento_persona=queryResult[0][0].documento_persona;

    if (validado == 0) {
      const codigoValidacion = generarCodigo(documento_persona);

      await connection.query(
        "UPDATE persona SET email_persona=? WHERE documento_persona = ?",
        [email_persona, documento_persona]
      );

      enviarEmail(codigoValidacion, email_persona, documento_persona);
      return res
        .status(200)
        .json({ mge: "Correo de validación enviado", ok: true });
    } else {
      return res
        .status(200)
        .json({ mge: "el usuario ya está validado", ok: false });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

const editarClave = async (req, res) => {
  let connection;
  try {
    const { documento_persona, clave_actual, clave_nueva } = req.body;

    // Establecer la conexión a la base de datos MySQL
    connection = await conectarBDEstadisticasMySql();

    // Consultar el usuario por su email
    const [result] = await connection.query(
      "SELECT * FROM persona WHERE documento_persona = ?",
      [documento_persona]
    );

    // Verificar si se encontró el usuario
    if (result.length > 0) {
      const usuario = result[0];
      const passOk = await bcrypt.compare(clave_actual, usuario.clave);
      if (!passOk) {
        await connection.end();
        return res
          .status(200)
          .json({ message: "La clave actual es incorrecta ", ok: false });
      }

      // Verificar si el usuario ya está validado
      if (usuario.validado) {
        const hashedPassword = await bcrypt.hash(clave_nueva, 10);

        // Actualizar el estado de validación del usuario
        await connection.query(
          "UPDATE persona SET clave = ? WHERE documento_persona = ?",
          [hashedPassword, documento_persona]
        );
        await connection.end();
        return res
          .status(200)
          .json({ message: "Clave modificada con éxito", ok: true });
      } else {
        // El usuario ya está validado
        await connection.end();
        return res
          .status(200)
          .json({ message: "El usuario no está validado", ok: false });
      }
    } else {
      // No se encontró el usuario
      await connection.end();
      return res
        .status(200)
        .json({ message: "Usuario no encontrado", ok: false });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || "Algo salió mal :(" });
  }
};

const restablecerClave = async (req, res) => {
  let connection;
  try {
    const { email } = req.body;

    const clave_nueva = generarCodigoAfaNumerico();

    // Establecer la conexión a la base de datos MySQL
    connection = await conectarBDEstadisticasMySql();

    // Consultar el usuario por su email
    const [result] = await connection.query(
      "SELECT * FROM persona WHERE email_persona = ?",
      [email]
    );

    // Verificar si se encontró el usuario
    if (result.length > 0) {
      if (result[0].validado == 0) {
        await connection.end();
        return res.status(200).json({
          message:
            "¡Usuario no validado! El usuario debe estar validado para poder restablecer su clave",
          ok: false,
        });
      }
      const hashedPassword = await bcrypt.hash(clave_nueva, 10);

      await connection.query(
        "UPDATE persona SET clave = ? WHERE email_persona = ?",
        [hashedPassword, email]
      );
      await connection.end();
      const mailOptions = {
        from: "SMT-Ciudadano Digital <no-reply-cdigital@smt.gob.ar>", // Coloca tu dirección de correo electrónico
        to: email, // Utiliza el correo electrónico del usuario recién registrado
        subject: "Restablecer Clave",
        text: `Tu nueva clave temporal es: ${clave_nueva}. Recuerda cambiarla después de iniciar sesión`,
      };

      transporter.sendMail(mailOptions, (errorEmail, info) => {
        if (errorEmail) {
          return res.status(500).json({
            msg: "Error al enviar el correo electrónico:",
            error: errorEmail,
          });
        } else {
          return res.status(200).json({
            message: `Se envió un email a ${email} con una clave temporal`,
            ok: true,
          });
        }
      });
    } else {
      // No se encontró el usuario
      return res.status(200).json({
        message: "El email ingresado no corresponde a un usuario registrado",
        ok: false,
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || "Algo salió mal :(" });
  }
};

const desactivarUsuario = async (req, res) => {
  let connection;
  try {
    const { documento_persona } = req.body.data;
    connection = await conectarBDEstadisticasMySql();
    console.log(req.body.data);
    // const [result] = await connection.query(
    //   "SELECT * FROM persona WHERE documento_persona = ?",
    //   [documento_persona]
    // );

    await connection.query(
      "UPDATE persona SET habilita = 3, validado = 0 WHERE documento_persona= ?",
      [documento_persona]
    );
    await connection.end();
    return res
      .status(200)
      .json({ message: "Clave modificada con éxito", ok: true });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || "Algo salió mal :(" });
  }
};

module.exports = {
  login,
  getAuthStatus,
  obtenerOpcionesHabilitadas,
  obtenerUsuarios,
  editarUsuario,
  borrarUsuario,
  obtenerCiudadanoPorDNIMYSQL,
  obtenerCiudadanoPorEmailMYSQL,
  validarUsuarioMYSQL,
  agregarUsuarioMYSQL,
  editarUsuarioCompleto,
  enviarEmailValidacion,
  obtenerPermisos,
  editarClave,
  restablecerClave,
  desactivarUsuario,
};
