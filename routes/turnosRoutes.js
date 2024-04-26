const { Router } = require("express");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");
const { obtenerTramites, obtenerProcedimientos, obtenerFunciones, existeTurno, obtenerTurnosDisponiblesPorDia, obtenerTurnosDisponiblesPorHora } = require("../controllers/turnosControllers");
const router = Router();

router.get("/listarTramites", obtenerTramites);
router.get("/listarProcedimientos", obtenerProcedimientos);
router.get("/listarFunciones", obtenerFunciones);
router.get("/existeTurno", existeTurno);
router.get("/buscarTurnosDisponiblesPorDia",obtenerTurnosDisponiblesPorDia)
router.get("/buscarTurnosDisponiblesPorHora",obtenerTurnosDisponiblesPorHora)

module.exports = router;
