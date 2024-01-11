const { Router } = require("express");
const { obtenerProcedimientos, ejecutarProcedimiento } = require("../controllers/pruebaControllers");
const router = Router();

// router.post("/listar", obtenerReclamosPorProcedimiento);
router.get("/listarProcedimientos", obtenerProcedimientos);
router.post('/ejecutarProcedimiento', async (req, res) => {
    try {
        const {procedimiento} = req.body
        console.log(procedimiento)
      // Llamada al controlador para ejecutar el procedimiento almacenado
      const resultado = await ejecutarProcedimiento(procedimiento
    //   , {
    //     // Parámetros del procedimiento almacenado (si es necesario)
    //     parametro1: 'valor1',
    //     parametro2: 'valor2',
    //   }
      );
      res.json(resultado);
    } catch (error) {
      res.status(500).json({ error: 'Error de servidor' });
    }
  });


module.exports = router;