const { conectarMySql } = require("../config/dbMYSQL");
const { sequelize_ciu_digital } = require("../config/sequelize");
const MovimientoReclamo = require("../models/Macro/MovimientoReclamo");
const Reclamo = require("../models/Macro/Reclamo");

const obtenerCategorias = async (req, res) => {
    try {
        const connection = await conectarMySql();
        console.log('Conectado a MySQL');

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

        const [results, fields] = await connection.execute(
            "SELECT tipo_reclamo.id_treclamo,tipo_reclamo.corto_treclamo FROM tipo_reclamo WHERE tipo_reclamo.habilita = ? AND tipo_reclamo.id_categoria = ?",
            [1, id_categoria]
        );
        
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

const ingresarReclamo = async (req,res)=>{
    let transaction;
    try {
      const { id_categoria, id_treclamo,asunto,detalle,direccion,descripcion_lugar,coorde1,coorde2,apellido_nombre,telefono,email,cuit } = req.body;

      //VERIFICAR QUE CATEGORIA Y tipo de reclamo COINCIDAN

      transaction = await sequelize_ciu_digital.transaction();
      
      const connection = await conectarMySql();
      console.log('Conectado a MySQL');

      const [tipoDeReclamo, fieldsTipoDeReclamo] = await connection.execute(
        "SELECT tipo_reclamo.id_prioridad FROM tipo_reclamo WHERE tipo_reclamo.id_treclamo = ? AND tipo_reclamo.habilita = ?",
        [id_treclamo, 1]
    );
    
    const [derivacionReclamo, fieldsDerivacionReclamo] = await connection.execute(
        "SELECT derivacion_reclamo.* FROM derivacion_reclamo WHERE derivacion_reclamo.id_treclamo = ? AND derivacion_reclamo.habilita = ?",
        [id_treclamo, 1]
    );    

      const reclamoObj = {
        id_categoria,
        id_oreclamo:15,
        id_estado:1,
        id_treclamo,
        asunto,
        detalle,
        direccion,
        descripcion_lugar,
        coorde1,
        coorde2,
        apellido_nombre,
        telefono,
        email,
        cuit,
        id_prioridad:tipoDeReclamo[0].id_prioridad
      };
  
      const nuevoReclamo = await Reclamo.create(reclamoObj, {
        transaction,
      });
  
      const reclamoId = nuevoReclamo.id_reclamo;
    
      await MovimientoReclamo.create(
        {
          id_reclamo:reclamoId,
          id_derivacion:derivacionReclamo[0].id_derivacion,
          id_oficina:derivacionReclamo[0].id_oficina_deriva,
          id_estado:1,
          id_motivo:1,
          detalle_movi:"Inicio del trámite",
          fecha_ingreso:"0000-00-00 00:00:00",
          fecha_egreso:"0000-00-00 00:00:00",
          oficina_graba:5000
        },
        { transaction }
      );

      const [oficinaYReparticion, fieldsOficinaYReparticion] = await connection.execute(
        "SELECT oficina_reparti.nombre_oficina,reparti.nombre_reparti FROM oficina_reparti JOIN reparti ON oficina_reparti.id_reparti = reparti.id_reparti WHERE oficina_reparti.id_oficina = ?",
        [derivacionReclamo[0].id_oficina_deriva]
    );

      await transaction.commit();
  
      res.status(200).json({ message: "Reclamo generado con éxito",Numero_Reclamo:reclamoId,Estado: "Iniciado",Repartición_Derivada:oficinaYReparticion[0].nombre_reparti, Oficina_Receptora:oficinaYReparticion[0].nombre_oficina});

    } catch (error) {
      res.status(500).json({ message: error.message || "Algo salió mal :(" });
    }
}

module.exports = {
    obtenerCategorias,obtenerTiposDeReclamoPorCategoria,ingresarReclamo
}