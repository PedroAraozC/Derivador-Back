// sequelize.js

const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_GAF,
  process.env.USER_CIU_DIGITAL,
  process.env.PASSWORD_CIU_DIGITAL,
  {
    host: process.env.HOST_CIU_DIGITAL,
    // port: process.env.PORT_CIU_DIGITAL,
    port: 3306,
    dialect: "mysql",
    pool: {
      max: 30,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    // Otros opciones de configuraciÃ³n...
  }
);

const sequelize_ciu_digital_derivador = new Sequelize(
  process.env.DB_CIU_DIGITAL,
  process.env.USER_CIU_DIGITAL,
  process.env.PASSWORD_CIU_DIGITAL,
  {
    host: process.env.HOST_CIU_DIGITAL,
    port: process.env.PORT_CIU_DIGITAL,
    dialect: "mysql",
    pool: {
      max: 30,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    // Otros opciones de configuraciÃ³n...
  }
);

const sequelize_ciu_digital = new Sequelize("ciudadano", "siac", "jo180401", {
  //host: process.env.HOST,
  //port: process.env.PORT_CIU_DIGITAL,
  host: "192.96.215.86",
  port: 3306,
  dialect: "mysql",
  pool: {
    max: 30,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  // Otros opciones de configuraciÃ³n...
});

module.exports = {
  sequelize,
  sequelize_ciu_digital,
  sequelize_ciu_digital_derivador,
};
