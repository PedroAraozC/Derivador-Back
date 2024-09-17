// models/DetMovimiento.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/sequelize');
// const sequelize = require('../sequelize');

const DetMovimientoNomenclador = sequelize.define('DetMovimientoNomenclador', {
  detmovimiento_nomenclador_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cantidad: {
    type: DataTypes.DECIMAL,
    allowNull: false
  },
  precio: {
    type: DataTypes.DECIMAL,
    allowNull: false
  },
  total: {
    type: DataTypes.DECIMAL,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: false
  },
  movimiento_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  nomenclador_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  detPresupuesto_id:{
    type: DataTypes.INTEGER,
    allowNull: true
  }
},
{
    tableName:'detmovimiento_nomenclador',
    timestamps: false
});

module.exports = DetMovimientoNomenclador;
