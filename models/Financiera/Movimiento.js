// models/Movimiento.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/sequelize');

// const sequelize = require('../sequelize');

const Movimiento = sequelize.define('Movimiento', {
  movimiento_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  movimiento_fecha: {
    type: DataTypes.DATE,
    allowNull: false
  },
  expediente_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipomovimiento_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
},{
    tableName: 'movimiento',
    timestamps: false
});

module.exports = Movimiento;
