// models/DetMovimiento.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/sequelize');
// const sequelize = require('../sequelize');

const DetMovimiento = sequelize.define('DetMovimiento', {
  detmovimiento_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  detpresupuesto_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  detmovimiento_importe: {
    type: DataTypes.STRING,
    allowNull: false
  },
  movimiento_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  detpresupuesto_id2:{
    type: DataTypes.INTEGER,
    allowNull: true
  }
},
{
    tableName:'detmovimiento',
    timestamps: false
});

module.exports = DetMovimiento;
