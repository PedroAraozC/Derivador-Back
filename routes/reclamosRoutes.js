const { Router } = require("express");
const { obtenerReclamosPorProcedimiento, obtenerProcedimientos } = require("../controllers/reclamosControllers");

const router = Router();

router.post("/listar", obtenerReclamosPorProcedimiento);
router.get("/listarProcedimientos", obtenerProcedimientos);


module.exports = router;