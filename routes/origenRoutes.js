const { Router } = require("express");
const {
  getOrigen,
  getOrigenTodo,
  postOrigen,
  putOrigenListado,
  disableOrigenListado,
} = require("../controllers/origenControllers");

const router = Router();

router.get("/listar", getOrigen);
router.get("/listado", getOrigenTodo);

router.post("/alta", postOrigen);

router.put("/editar", putOrigenListado);

router.patch("/deshabilitar", disableOrigenListado);

module.exports = router;
