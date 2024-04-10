// models/Movimiento.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/sequelize');
// const sequelize = require('../sequelize');

const MovimientoReclamo = sequelize.define('MovimientoReclamo', {
  id_movi: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_reclamo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_derivacion: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_oficina: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_estado: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_motivo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  oficina_graba: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  detalle_movi: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fecha_ingreso: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fecha_egreso: {
    type: DataTypes.STRING,
    allowNull: false
  },
},{
    tableName: 'mov_reclamo_prueba',
    timestamps: false
});

module.exports = MovimientoReclamo;
