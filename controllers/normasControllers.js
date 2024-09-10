const CustomError = require("../utils/customError");
const { conectarMySqlBol } = require("../config/dbMySqlBoletin");

const getNormas = async (req, res) => {
  try {
    const db = await conectarMySqlBol();
    if (!db || !db.query) {
      throw new CustomError(
        "Database connection or query function is missing",
        500
      );
    }
    const [normas] = await db.query("SELECT * FROM norma WHERE habilita = 1");

    res.json(normas);
    await db.end();
  } catch (error) {
    // await db.end();
    console.error("Error al buscar norma:", error);
    res.status(500).json({ message: "Error al buscar norma" });
  }
};

const putNormasListado = async (req, res) => {
  try {
    const db = await conectarMySqlBol();

    const { id_norma, tipo_norma, habilita } = req.body;

    await db.query(
      "UPDATE norma SET id_norma = ?, tipo_norma = ?, habilita = ? WHERE id_norma = ?",
      [id_norma, tipo_norma.toUpperCase(), habilita, id_norma] // Aquí, se deben pasar los parámetros como una matriz plana
    );

    res.status(200).json({ message: "Norma actualizada con éxito" });
    await db.end();
  } catch (error) {
    // await db.end();
    console.error("Error al actualizar norma:", error);
    res.status(500).json({ message: "Error al actualizar Norma" });
  }
};

const disableNormasListado = async (req, res) => {
  try {
    const db = await conectarMySqlBol();
    const { habilita, normaId } = req.body;
// console.log(req.body)
    if (typeof habilita === "undefined" || !normaId) {
      return res.status(400).json({ message: "Datos inválidos" });
    }

    await db.query(
      "UPDATE norma SET habilita = ? WHERE id_norma = ?",
      [habilita, normaId] // Aquí, se deben pasar los parámetros como una matriz plana
    );

    res.status(200).json({ message: "Norma actualizada con éxito" });
    await db.end();
  } catch (error) {
    console.error("Error al actualizar norma:", error);
    res.status(500).json({ message: "Error al actualizar Norma" });
  }
};
const getNormasListado = async (req, res) => {
  try {
    const db = await conectarMySqlBol();
    if (!db || !db.query) {
      throw new CustomError(
        "Database connection or query function is missing",
        500
      );
    }
    const [normas] = await db.query("SELECT * FROM norma");
    res.json(normas);
    await db.end();
  } catch (error) {
    // await db.end();
    console.error("Error al buscar norma:", error);
    res.status(500).json({ message: "Error al buscar norma" });
  }
};

const postNorma = async (req, res) => {
  try {
    const db = await conectarMySqlBol();
    if (!db || !db.query) {
      throw new CustomError(
        "Database connection or query function is missing",
        500
      );
    }
    const [result] = await db.query(
      "INSERT INTO norma (tipo_norma, habilita) VALUES ( ?, ?)",
      [req.body.norma.toUpperCase(), req.body.habilita]
    );

    res.json(result);
    await db.end();
  } catch (error) {
    // await db.end();
    console.error("Error al agregar norma:", error);
    res.status(500).json({ message: "Error al agregar norma" });
  }
};

module.exports = {
  getNormas,
  putNormasListado,
  getNormasListado,
  postNorma,
  disableNormasListado,
};
