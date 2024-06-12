// models/Movimiento.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/sequelize');

// const sequelize = require('../sequelize');

const Expediente = sequelize.define('Expediente', {
  expediente_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  expediente_numero: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expediente_anio: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  expediente_causante: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expediente_asunto: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expediente_fecha: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expediente_detalle:{
    type: DataTypes.STRING,
    allowNull: false
  }
},{
    tableName: 'expediente',
    timestamps: false
});

module.exports = Expediente;