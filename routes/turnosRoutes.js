const { Router } = require("express");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");
const { obtenerTramites, obtenerProcedimientos, obtenerFunciones, existeTurno, obtenerTurnosDisponiblesPorDia, obtenerTurnosDisponiblesPorHora, confirmarTurno, anularTurno } = require("../controllers/turnosControllers");
const router = Router();

router.get("/listarTramites", obtenerTramites);
router.get("/listarProcedimientos", obtenerProcedimientos);
router.get("/listarFunciones", obtenerFunciones);
router.get("/existeTurno", existeTurno);
router.post("/confirmarTurno", confirmarTurno)
router.get("/anularTurno", anularTurno)
router.get("/buscarTurnosDisponiblesPorDia",obtenerTurnosDisponiblesPorDia)
router.get("/buscarTurnosDisponiblesPorHora",obtenerTurnosDisponiblesPorHora)

module.exports = router;
