// sequelize.js

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_GAF , process.env.USER_CIU_DIGITAL, process.env.PASSWORD_CIU_DIGITAL, {
  host: process.env.HOST_CIU_DIGITAL,
  dialect: 'mysql',
  // Otros opciones de configuración...
});

const sequelize_ciu_digital = new Sequelize(process.env.DATABASE_CIU , process.env.USER, process.env.PASSWORD, {
  host: process.env.HOST,
  dialect: 'mysql',
  // Otros opciones de configuración...
});

module.exports = {sequelize,sequelize_ciu_digital};
