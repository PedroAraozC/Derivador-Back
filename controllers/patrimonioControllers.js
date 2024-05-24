const { conectarSMTPatrimonio } = require("../config/dbEstadisticasMYSQL");

const listarTipologiaPatrimonio = async (req, res) => {
    const connection = await conectarSMTPatrimonio();
    try {
      const [tipologias] = await connection.execute(
        'SELECT * FROM tipologia WHERE habilita = 1'
      );
      connection.end();
      res.status(200).json({ tipologias })
  
    } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
  }


  module.exports={ listarTipologiaPatrimonio }