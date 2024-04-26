const { conectarDBTurnosPrueba } = require("../config/dbTurnosMYSQL");

const obtenerTramites = async (req, res) => {
    try {
        const reparticion_id = req.query.reparticion_id;
      const connection = await conectarDBTurnosPrueba();
      console.log("Conectado a MySQL");
  
      const [tramites, fields] = await connection.execute(
        " SELECT tramite.idtramite, tramite.nombre_tramite, tramite.reparticion_id FROM tramite WHERE reparticion_id = ? ",[reparticion_id]
      );
  
      res.status(200).json({ tramites });

      await connection.end();
      console.log("Conexión cerrada");
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

        res.status(200).json({ tramites });

        await connection.end();
        console.log('Conexión cerrada');

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

        res.status(200).json({ funciones });

        await connection.end();
        console.log('Conexión cerrada');

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
};


const existeTurno = async (req, res) => {
    try {
      const cuil = req.query.cuil;
      const connection = await conectarDBTurnosPrueba();
      // console.log(cuil);
      console.log("Conectado a MySQL");
  
      let sqlQuery = `CALL api_existeturno(?,?)`;
      const [results, fields] = await connection.execute(sqlQuery, [1, cuil]);
  console.log(results[0]);
      connection.close();
      res.status(200).json(results[0]);
  
      console.log("Conexión cerrada");
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Error de servidor" });
    }
  };

  module.exports = {obtenerTramites, obtenerProcedimientos,obtenerFunciones, existeTurno}