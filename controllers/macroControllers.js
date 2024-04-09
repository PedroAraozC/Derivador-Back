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

const listarReclamosCiudadano= async (req, res) => {
    const cuit = req.body.cuit;
    const telefono = req.body.telefono;
    const connection = await conectarMySql();
    console.log('Conectado a MySQL');
   
    try {

if(cuit)
{
    let sqlQuery = "SELECT r.id_reclamo,  tr.nombre_treclamo, r.asunto, r.direccion, r.apellido_nombre, r.fecha_hora_inicio, cr.nombre_categoria FROM reclamo_prueba r  JOIN categoria_reclamo cr ON r.id_categoria = cr.id_categoria JOIN tipo_reclamo tr ON r.id_treclamo = tr.id_treclamo WHERE r.cuit = ? ";
    

    const [reclamos] = await connection.execute(sqlQuery, [cuit]);
    
 await connection.end();

 if(reclamos.length>0) res.status(200).json({ reclamos });
 else res.status(200).json({ message:"no se encontraron reclamos asociados al CUIT" });
    

}

if(telefono)
{
    let sqlQuery = "SELECT id_reclamo, id_categoria, id_treclamo, asunto, direccion, apellido_nombre, fecha_hora_inicio FROM reclamo_prueba WHERE telefono = ?";
    

    const [reclamos] = await connection.execute(sqlQuery, [telefono]);
 await connection.end();

 if(reclamos.length>0) res.status(200).json({ reclamos });
 else res.status(200).json({ message:"no se encontraron reclamos asociados al Telefono" });
    

}


  
    } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
  }

module.exports = {
    obtenerCategorias,obtenerTiposDeReclamoPorCategoria,listarReclamosCiudadano
}

