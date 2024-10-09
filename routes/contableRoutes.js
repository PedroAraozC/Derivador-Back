const { Router } = require("express");
const { ejecutarProcedimiento, obtenerProcedimientos } = require("../controllers/contableControllers");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");
const router = Router();

router.get("/listarProcedimientos",auth, obtenerProcedimientos);
router.post('/ejecutarProcedimiento',auth, ejecutarProcedimiento)


module.exports = router;