const { Router } = require("express");
const { ejecutarProcedimiento, obtenerProcedimientos } = require("../controllers/contableControllers");
const router = Router();

router.get("/listarProcedimientos", obtenerProcedimientos);
router.post('/ejecutarProcedimiento', ejecutarProcedimiento)


module.exports = router;