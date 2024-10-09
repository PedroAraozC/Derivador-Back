const { DataTypes } = require('sequelize');
const { sequelize_ciu_digital_derivador } = require('../../config/sequelize');

const PermisoPersona = sequelize_ciu_digital_derivador.define('PermisoPersona', {
    id_permiso_persona: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_proceso: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_persona: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ver: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    agregar: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    modificar: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    habilita: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
}, {
    tableName: 'permiso_persona',
    timestamps: false
});

module.exports = PermisoPersona;