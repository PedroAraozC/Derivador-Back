const { conectar_BD_EDUCACION_MySql } = require("../config/dbEstadisticasMYSQL");



const listarConvocatorias =async(req,res)=>{
    const connection = await conectar_BD_EDUCACION_MySql();
  try {
      const [convocatorias] = await connection.execute(
        'SELECT c.*, cau.nombre_causal, n.nombre_nivel, car.nombre_caracter, e.nombre_establecimiento, e.domicilio FROM convocatoria c ' +
        'left JOIN establecimiento e ON c.id_establecimiento = e.id_establecimiento ' +
        'left JOIN causal cau ON c.id_causal = cau.id_causal ' +
        'left JOIN caracter car ON c.id_caracter = car.id_caracter ' +
        'left JOIN nivel n ON c.id_nivel = n.id_nivel WHERE c.habilita = 1'
      );
      res.status(200).json({convocatorias})
     
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }  finally {
      if (connection) {
        connection.release();
      }
    }
}

const listarNiveles =async(req,res)=>{
    const connection = await conectar_BD_EDUCACION_MySql();
  try {
      const [niveles] = await connection.execute(
        'SELECT * FROM nivel WHERE habilita = 1'
      );
      res.status(200).json({niveles})
     
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }  finally {
      if (connection) {
        connection.release();
      }
    }
}

const listarEstablecimientos =async(req,res)=>{
    const connection = await conectar_BD_EDUCACION_MySql();
  try {
      const [establecimientos] = await connection.execute(
        'SELECT * FROM establecimiento WHERE habilita = 1'
      );
      res.status(200).json({establecimientos})
     
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }  finally {
      if (connection) {
        connection.release();
      }
    }
}
const listarCausal =async(req,res)=>{
    const connection = await conectar_BD_EDUCACION_MySql();
  try {
      const [causal] = await connection.execute(
        'SELECT * FROM causal WHERE habilita = 1'
      );
      res.status(200).json({causal})
     
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }  finally {
      if (connection) {
        connection.release();
      }
    }
}
const listarCaracter =async(req,res)=>{
    const connection = await conectar_BD_EDUCACION_MySql();
  try {
      const [caracter] = await connection.execute(
        'SELECT * FROM caracter WHERE habilita = 1'
      );
      res.status(200).json({caracter})
     
  } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
  }  finally {
      if (connection) {
        connection.release();
      }
    }
}



module.exports={ listarConvocatorias, listarNiveles, listarEstablecimientos, listarCausal, listarCaracter }