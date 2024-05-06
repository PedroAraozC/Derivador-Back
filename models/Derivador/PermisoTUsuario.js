const { DataTypes } = require('sequelize');
const { sequelize_ciu_digital_derivador } = require('../../config/sequelize');

const PermisoTUsuario = sequelize_ciu_digital_derivador.define('PermisoTUsuario', {
    id_permiso_tusuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_proceso: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_tusuario: {
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
    tableName: 'permiso_tusuario',
    timestamps: false
});

module.exports = PermisoTUsuario;