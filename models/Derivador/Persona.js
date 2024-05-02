const { DataTypes } = require('sequelize');
const { sequelize_ciu_digital_derivador } = require('../../config/sequelize');

const Persona = sequelize_ciu_digital_derivador.define('Persona', {
    id_persona: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    documento_persona: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    id_tdocumento: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    apellido_persona: {
        type: DataTypes.STRING,
        allowNull: true
    },
    nombre_persona: {
        type: DataTypes.STRING,
        allowNull: true
    },
    id_genero: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    fecha_nacimiento_persona: {
        type: DataTypes.DATE,
        allowNull: true
    },
    domicilio_persona: {
        type: DataTypes.STRING,
        allowNull: true
    },
    localidad_persona: {
        type: DataTypes.STRING,
        allowNull: true
    },
    id_provincia: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    id_pais: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    telefono_persona: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email_persona: {
        type: DataTypes.STRING,
        allowNull: true
    },
    id_tusuario: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    clave: {
        type: DataTypes.STRING,
        allowNull: true
    },
}, {
    tableName: 'persona',
    timestamps: false
});

module.exports = Persona;