const { Router } = require("express");
const { getNormas, putNormasListado, getNormasListado, postNorma, disableNormasListado} = require("../controllers/normasControllers");

const router = Router();

router.get("/listar", getNormas);
router.get("/listado", getNormasListado);

router.put("/editar", putNormasListado);
router.patch("/deshabilitar",disableNormasListado)

router.post("/alta", postNorma);

module.exports = router;
