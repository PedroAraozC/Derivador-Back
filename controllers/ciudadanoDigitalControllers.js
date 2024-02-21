const { conectarBDEstadisticasMySql } = require("../config/dbEstadisticasMYSQL");

const listarOpciones =async(req,res)=>{
    try {
    
        const connection = await conectarBDEstadisticasMySql();

        const [opciones] = await connection.execute(
            'SELECT * FROM opcion'
        );
        res.status(200).json({opciones})
    } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
}

const listarProcesos =async(req,res)=>{
    try {
    
        const connection = await conectarBDEstadisticasMySql();

        const [procesos] = await connection.execute(
            'SELECT proceso.*, opcion.nombre_opcion AS opcion FROM proceso JOIN opcion ON proceso.id_opcion = opcion.id_opcion'
        );
        res.status(200).json({procesos})
    } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
}

const listarTiposDeUsuarios =async(req,res)=>{
    try {
    
        const connection = await conectarBDEstadisticasMySql();

        const [procesos] = await connection.execute(
            'SELECT * FROM tipo_usuario'
        );
        res.status(200).json({procesos})
    } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
}

module.exports={listarOpciones,listarProcesos,listarTiposDeUsuarios}