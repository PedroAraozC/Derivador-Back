const { conectar_BD_Gestion_MySql } = require("../config/dbEstadisticasMYSQL");

const traerLinks = async (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ message: "Falta el ID en la solicitud." });
    }
    const sql = `
        SELECT e.*, p.id_persona 
        FROM enlaces e 
        LEFT JOIN permiso_persona p 
        ON e.id_enlace = p.id_enlace 
        WHERE e.habilita = 1 AND p.id_persona = ?
    `;
    const values = [id];
    let connection;
    try {
        connection = await conectar_BD_Gestion_MySql();
        const [links] = await connection.execute(sql, values);
        res.status(200).json({ links });
    } catch (error) {
        res.status(500).json({ message: error.message || "Algo salió mal :(" });
    } finally {
        if (connection) {connection.end();}
    }
};


module.exports = { traerLinks };
