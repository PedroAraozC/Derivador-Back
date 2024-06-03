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

const listarCategoriaPatrimonio = async (req, res) => {
    const connection = await conectarSMTPatrimonio();
    try {
      const [categorias] = await connection.execute(
        'SELECT * FROM categoria WHERE habilita = 1'
      );
      connection.end();
      res.status(200).json({ categorias })
  
    } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
  }

const listarMaterialPatrimonio = async (req, res) => {
    const connection = await conectarSMTPatrimonio();
    try {
      const [materiales] = await connection.execute(
        'SELECT * FROM material WHERE habilita = 1'
      );
      connection.end();
      res.status(200).json({ materiales })
  
    } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
  }

const listarEstadoPatrimonio = async (req, res) => {
    const connection = await conectarSMTPatrimonio();
    try {
      const [estados] = await connection.execute(
        'SELECT * FROM estado WHERE habilita = 1'
      );
      connection.end();
      res.status(200).json({ estados })
  
    } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
  }

const listarAutorPatrimonio = async (req, res) => {
    const connection = await conectarSMTPatrimonio();
    try {
      const [autores] = await connection.execute(
        'SELECT * FROM autor WHERE habilita = 1'
      );
      connection.end();
      res.status(200).json({ autores })
  
    } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
  }

const listarUbicacionPatrimonio = async (req, res) => {
    const connection = await conectarSMTPatrimonio();
    try {
      const [ubicaciones] = await connection.execute(
        'SELECT * FROM ubicacion WHERE habilita = 1'
      );
      connection.end();
      res.status(200).json({ ubicaciones })
  
    } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
  }
  
const listarPatrimonio = async (req, res) => {
    const connection = await conectarSMTPatrimonio();
    try {
      const [patrimonios] = await connection.execute(
        'SELECT * FROM patrimonio WHERE habilita = 1'
      );
      connection.end();
      res.status(200).json({ patrimonios })
  
    } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
  }

const listarPatrimonioPorId = async (req, res) => {
  const { id } = req.params; 
  const sql = "SELECT * FROM patrimonio WHERE id_contratacion = ?";
  const values = [id];
  try {
    const connection = await conectarSMTPatrimonio();
    const [patrimonio] = await connection.execute(sql, values); 
    await connection.end();
    if (patrimonio.length > 0) { 
      res.status(200).json({ patrimonio });
    } else {
      res.status(400).json({ message: "No se encontró el patrimonio" });
    }

  } catch (error) {
    res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }
  }


  module.exports={ listarTipologiaPatrimonio, listarPatrimonioPorId, listarCategoriaPatrimonio, listarAutorPatrimonio, listarEstadoPatrimonio, listarUbicacionPatrimonio, listarMaterialPatrimonio, listarPatrimonio }