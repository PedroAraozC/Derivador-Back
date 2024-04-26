const { DataTypes } = require('sequelize');
const { sequelize_ciu_digital_derivador } = require('../../config/sequelize');

const Proceso = sequelize_ciu_digital_derivador.define('Proceso', {
    id_proceso: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_proceso: {
        type: DataTypes.STRING,
        allowNull: true
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    id_opcion: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    habilita: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
}, {
    tableName: 'proceso',
    timestamps: false
});

module.exports = Proceso;