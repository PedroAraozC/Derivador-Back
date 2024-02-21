const { Router } = require("express");
const { obtenerReclamosPorProcedimiento, obtenerProcedimientos } = require("../controllers/reclamosControllers");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");

const router = Router();

router.post("/listar",auth,verifyRole, obtenerReclamosPorProcedimiento);
router.get("/listarProcedimientos",auth,verifyRole, obtenerProcedimientos);


module.exports = router;