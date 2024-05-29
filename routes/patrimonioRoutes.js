const { Router } = require("express");
const { listarTipologiaPatrimonio, listarCategoriaPatrimonio, listarMaterialPatrimonio, listarEstadoPatrimonio, listarAutorPatrimonio, listarUbicacionPatrimonio, listarPatrimonio } = require("../controllers/patrimonioControllers");
const router = Router();


router.get("/listarTipologiasPatrimonio", listarTipologiaPatrimonio)
router.get("/listarCategoriasPatrimonio", listarCategoriaPatrimonio)
router.get("/listarMaterialesPatrimonio", listarMaterialPatrimonio)
router.get("/listarEstadosPatrimonio", listarEstadoPatrimonio)
router.get("/listarAutoresPatrimonio", listarAutorPatrimonio)
router.get("/listarUbicacionesPatrimonio", listarUbicacionPatrimonio)
router.get("/listarPatrimonios", listarPatrimonio)



module.exports = router;