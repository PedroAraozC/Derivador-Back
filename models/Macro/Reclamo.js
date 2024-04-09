// models/Movimiento.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/sequelize');

// const sequelize = require('../sequelize');

const Reclamo = sequelize.define('Reclamo', {
  id_reclamo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
//   fecha_hora_inicio: {
//     type: DataTypes.DATE,
//     allowNull: false
//   },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_treclamo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_oreclamo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_estado: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_prioridad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_estado: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  descripcion_lugar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: false
  },
  detalle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  asunto: {
    type: DataTypes.STRING,
    allowNull: false
  },
  coorde1: {
    type: DataTypes.STRING,
    allowNull: false
  },
  coorde2: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apellido_nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cuit: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
},{
    tableName: 'reclamo_prueba',
    timestamps: false
});

module.exports = Reclamo;