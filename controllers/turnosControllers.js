const { conectarDBTurnosPrueba } = require("../config/dbTurnosMYSQL");
const nodemailer = require('nodemailer');

const obtenerTramites = async (req, res) => {
    try {
        const reparticion_id = req.query.reparticion_id;
      const connection = await conectarDBTurnosPrueba();
      console.log("Conectado a MySQL");
  
      const [tramites, fields] = await connection.execute(
        " SELECT tramite.idtramite, tramite.nombre_tramite, tramite.reparticion_id, tramite.observaciones, tramite.adicionalrequerido FROM tramite WHERE reparticion_id = ? ",[reparticion_id]
      );
      
      await connection.end();
      console.log("Conexión cerrada");

      res.status(200).json({ tramites });

    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Error de servidor" });
    }
  };

  const obtenerProcedimientos = async (req, res) => {
    try {
        const connection = await conectarDBTurnosPrueba();
        console.log('Conectado a MySQL');

        const [tramites, fields] = await connection.execute(process.env.QUERY_GET_PROCEDIMIENTOS_CEMA);

        await connection.end();
        console.log('Conexión cerrada');

        res.status(200).json({ tramites });


    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
};

const obtenerFunciones = async (req, res) => {
    try {
        const connection = await conectarDBTurnosPrueba();
        console.log('Conectado a MySQL');

        const [funciones, fields] = await connection.execute(process.env.QUERY_GET_FUNCIONES_CEMA);

        await connection.end();
        console.log('Conexión cerrada');

        res.status(200).json({ funciones });


    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
};


const existeTurno = async (req, res) => {
    try {
      const cuil = req.query.cuil;
      const id_tramite = req.query.id_tramite;
      const connection = await conectarDBTurnosPrueba();
      // console.log(cuil);
      console.log("Conectado a MySQL");
  
      let sqlQuery = `CALL api_existeturno(?,?)`;
      const [results, fields] = await connection.execute(sqlQuery, [id_tramite, cuil]);
      console.log(results[0]);
      connection.close();
      res.status(200).json(results[0]);
  
      console.log("Conexión cerrada");
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Error de servidor" });
    }
  };

  const obtenerTurnosDisponiblesPorDia = async (req, res) => {
    try {
         const id_tramite = req.query.id_tramite;
      const connection = await conectarDBTurnosPrueba();
  
      console.log("Conectado a MySQL");
  
      let sqlQuery = `CALL api_obtenerturnospordia(?)`;
      const [results, fields] = await connection.execute(sqlQuery,[id_tramite]);
  
      connection.close();
      res.status(200).json(results[0]);
  
      console.log("Conexión cerrada");
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Error de servidor" });
    }
  };
  
  const obtenerTurnosDisponiblesPorHora = async (req, res) => {
    try {
         const id_tramite = req.query.id_tramite;
      const fecha_solicitada = req.query.fecha_solicitada;
      console.log(fecha_solicitada);
      const connection = await conectarDBTurnosPrueba();
  
      console.log("Conectado a MySQL");
  
      let sqlQuery = `CALL api_obtenerturnosporhora(?, ?)`;
  
      const [results, fields] = await connection.execute(sqlQuery, [id_tramite, fecha_solicitada]);
      connection.close();
      res.status(200).json(results[0]);
  
      console.log("Conexión cerrada");
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Error de servidor" });
    }
  };

  const transporter = nodemailer.createTransport({
    // host: 'smtp.gmail.com',
    service:"gmail",
    // port: 465,
    // secure: true,
    auth: {
        user: 'no-reply-cdigital@smt.gob.ar',
        pass: process.env.PASSWORD_MAIL
    }
  });

const enviarEmail = (nombre_tramite,fecha,hora, email, res) => {

  const mailOptions = {
    from: 'SMT-Turnos no-reply-cdigital@smt.gob.ar',
    to: email,
    subject: `Turno Confirmado - ${nombre_tramite}`,
    text: `Su turno para el trámite: ${nombre_tramite} fue confirmado para el dia: ${fecha} a horas: ${hora}`
  };


  transporter.sendMail(mailOptions, (errorEmail, info) => {
    if (errorEmail) {
      // return res.status(500).json({ mge: 'Error al enviar el correo electrónico:', ok: false, error: errorEmail });
      console.log(errorEmail);
    } else {
      // return res.status(200).json({ mge: 'Correo electrónico enviado correctamente:', ok: true });
      console.log('Correo electrónico enviado correctamente');
    }
  });
}


  const confirmarTurno = async (req, res) => {
    try {

      const { cuil, id_tramite, apellido, nombre, fecha_solicitada, hora_solicitada, email, nombre_tramite,adicional} = req.body;
      console.log(req.body);

      const connection = await conectarDBTurnosPrueba();
      // console.log(req.query);
      console.log("Conectado a MySQL");
  
      let sqlQuery = `SELECT api_confirmarturno(?, ?, ?, ?, ?, ?,?)`;
      const [results, fields] = await connection.execute(sqlQuery, [id_tramite, cuil, apellido, nombre, fecha_solicitada, hora_solicitada,adicional]);
  
      if(Object.values(results[0])[0] == 1){
        enviarEmail(nombre_tramite,fecha_solicitada,hora_solicitada,email,res);
      }
      connection.close();
      console.log("Conexión cerrada");
      res.status(200).json(results[0]);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Error de servidor" });
    }
  };

  const anularTurno = async (req, res) => {
    try {
      const cuil = req.query.cuil;
      const id_tramite = req.query.id_tramite;
  
      const connection = await conectarDBTurnosPrueba();
      // console.log(req.query);
      console.log("Conectado a MySQL");
  
      let sqlQuery = `SELECT api_anularturno(?, ?)`;
      const [results, fields] = await connection.execute(sqlQuery, [id_tramite, cuil]);
      console.log(results);
      connection.close();
      res.status(200).json(results[0]);
  
      console.log("Conexión cerrada");
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Error de servidor" });
    }
  };
  

  module.exports = {obtenerTramites, obtenerProcedimientos,obtenerFunciones, existeTurno, obtenerTurnosDisponiblesPorDia, obtenerTurnosDisponiblesPorHora, confirmarTurno, anularTurno}