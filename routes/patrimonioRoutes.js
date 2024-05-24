const { Router } = require("express");
const { listarTipologiaPatrimonio } = require("../controllers/patrimonioControllers");
const router = Router();


router.get("listarTipologiasPatrimonio", listarTipologiaPatrimonio)



module.exports = router;