const { conectarMySql } = require("../config/dbMYSQL");

const obtenerCategorias = async (req, res) => {
    try {
        const connection = await conectarMySql();
        console.log('Conectado a MySQL');

        // Llamar a un procedimiento almacenado
        const [results, fields] = await connection.execute(` SELECT categoria_reclamo.id_categoria,categoria_reclamo.nombre_categoria FROM categoria_reclamo WHERE categoria_reclamo.habilita = 1 `);
        // console.log(fields);
        // Enviar la respuesta
        res.status(200).json({ results });

        // Cerrar la conexión al finalizar
        await connection.end();
        console.log('Conexión cerrada');

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
}

const obtenerTiposDeReclamoPorCategoria = async (req, res) => {
    try {
        const id_categoria = req.query.id_categoria;
        const connection = await conectarMySql();
        console.log('Conectado a MySQL');

        // Llamar a un procedimiento almacenado
        const [results, fields] = await connection.execute(` SELECT tipo_reclamo.* FROM tipo_reclamo WHERE tipo_reclamo.habilita = 1 AND tipo_reclamo.id_categoria = ${id_categoria}`);
        // console.log(fields);
        // Enviar la respuesta
        res.status(200).json({ results });

        // Cerrar la conexión al finalizar
        await connection.end();
        console.log('Conexión cerrada');

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error de servidor' });
    }
}

module.exports = {
    obtenerCategorias,obtenerTiposDeReclamoPorCategoria
}