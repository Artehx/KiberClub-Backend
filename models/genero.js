const mongoose = require('mongoose');

const generoSchema = new mongoose.Schema(

    {
    idGenero: {type: String, require: true},
    icono: {type: String, require: true},
    nombreGenero: {type: String, require: true},
    }

);

module.exports = mongoose.model('Genero', generoSchema, "generos");