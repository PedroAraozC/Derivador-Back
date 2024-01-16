const { Router } = require("express");
const auth = require("../middlewares/auth");
const validateFields = require("../middlewares/validateFields");
const { check } = require("express-validator");
const { login, agregarUsuario } = require("../controllers/ditecUsuariosControllers");

const router = Router();

router.post(
    "/login",

    login
);

router.post("/alta", agregarUsuario);

module.exports = router;