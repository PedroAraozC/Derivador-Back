const { DataTypes } = require('sequelize');
const { sequelize_ciu_digital_derivador } = require('../../config/sequelize');

const Empleado = sequelize_ciu_digital_derivador.define('Empleado', {
    id_empleado: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_persona: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    afiliado: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    id_reparticion: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    habilita: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1
    },
}, {
    tableName: 'empleado',
    timestamps: false
});

module.exports = Empleado;