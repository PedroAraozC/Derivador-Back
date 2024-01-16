const { Schema, model } = require('mongoose');
const mongooseUniqueValidator = require('mongoose-unique-validator');

const UserSchema = new Schema(
    {
        nombreUsuario: {
            type: String,
            unique: true,
            trim: true,
            lowercase: true,
            minLength: [4, "Debe tener al menos 4 caracteres"],
            maxLength: [20, "Debe tener como máximo 20 caracteres"],
            required: [true, "El nombre de usuario es requerido"],
        },
        contraseña: {
            type: String,
            trim: true,
            required: [true, "La contraseña es obligatoria"],
        },

    },
    {
        versionKey: false,
        timestamps: false,
    }
);

UserSchema.methods.toJSON = function () {
    const { contraseña, ...user } = this.toObject();
    return user;
};

UserSchema.plugin(mongooseUniqueValidator, {
    message: '{PATH} debe ser único'
})

module.exports = model('User', UserSchema)