const { conectarBDUsuariosMySql } = require("../config/dbUsuariosMYSQL");

const agregarTipoDeUsuario = async (req,res) =>{
    try {
        const {rol} = req.body;
        const connection = await conectarBDUsuariosMySql();

        const [tipoDeUsuario] = await connection.execute(
            'SELECT * FROM tipoDeUsuario WHERE rol = ?',
            [rol]
        );
        if (tipoDeUsuario.length == 0) {

            const [result] = await connection.execute(
                'INSERT INTO tipoDeUsuario (rol) VALUES (?)',
                [rol]
            );

            await connection.end();

            res.status(200).json({ message: "Tipo De usuario creado con éxito", insertedId: result.insertId });
        } else {
            res.status(400).json({ message: "Tipo De usuario ya existente", rol: tipoDeUsuario[0].rol });
        }
    } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
}

const obtenerRoles =async(req,res)=>{
    try {
    
        const connection = await conectarBDUsuariosMySql();

        const [roles] = await connection.execute(
            'SELECT * FROM tipoDeUsuario'
        );
        res.status(200).json({roles})
    } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
}

module.exports={agregarTipoDeUsuario,obtenerRoles}