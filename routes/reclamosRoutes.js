const { Router } = require("express");
const { obtenerReclamosPorProcedimiento, obtenerProcedimientos } = require("../controllers/reclamosControllers");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");

const router = Router();

router.post("/listar",auth, obtenerReclamosPorProcedimiento);
router.get("/listarProcedimientos",auth, obtenerProcedimientos);


module.exports = router;