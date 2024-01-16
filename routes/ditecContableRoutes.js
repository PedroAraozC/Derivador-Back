const { Router } = require("express");
const { ejecutarProcedimiento, obtenerProcedimientos } = require("../controllers/ditecContableControllers");
const router = Router();

router.get("/listarProcedimientos", obtenerProcedimientos);
router.post('/ejecutarProcedimiento', ejecutarProcedimiento)


module.exports = router;