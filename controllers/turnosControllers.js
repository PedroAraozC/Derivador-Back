const { conectarDBTurnosPrueba } = require("../config/dbTurnosMYSQL");

const obtenerTramites = async (req, res) => {
    try {
        const reparticion_id = req.query.reparticion_id;
      const connection = await conectarDBTurnosPrueba();
      console.log("Conectado a MySQL");
  
      const [tramites, fields] = await connection.execute(
        " SELECT tramite.idtramite, tramite.nombre_tramite, tramite.reparticion_id, tramite.observaciones FROM tramite WHERE reparticion_id = ? ",[reparticion_id]
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

  const confirmarTurno = async (req, res) => {
    try {
      // const cuil = req.query.cuil;
      // const id_tramite = req.query.id_tramite;
      // const apellido = req.query.apellido;
      // const nombre = req.query.nombre;
      // const fecha_solicitada = req.query.fecha_solicitada;
      // const hora_solicitada = req.query.hora_solicitada;

      const { cuil, id_tramite, apellido, nombre, fecha_solicitada, hora_solicitada} = req.body;
      console.log(req.body);
      const connection = await conectarDBTurnosPrueba();
      // console.log(req.query);
      console.log("Conectado a MySQL");
  
      let sqlQuery = `SELECT api_confirmarturno(?, ?, ?, ?, ?, ?)`;
      const [results, fields] = await connection.execute(sqlQuery, [id_tramite, cuil, apellido, nombre, fecha_solicitada, hora_solicitada]);
  
      connection.close();
      res.status(200).json(results[0]);
  
      console.log("Conexión cerrada");
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